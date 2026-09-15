import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { extractProblemIds } from './utils/video_matcher.js';

export const VIDEO_SOURCES = [
    {
        name: 'NeetCode Blind 75',
        channel: 'NeetCode',
        playlistId: 'PLot-Xpze53ldVwtstag2TL4HQhAnC8ATf',
    },
    {
        name: 'Leetcode SQL Complete',
        channel: 'Everyday Data Science',
        playlistId: 'PLtfxzVLWb-B_dsIXFniI6PokR4anSP5rp',
    },
];

const YOUTUBE_ORIGIN = 'https://www.youtube.com';
const REQUEST_HEADERS = {
    'content-type': 'application/json',
    'user-agent': 'Mozilla/5.0',
};

const walkObjects = (value, visit) => {
    if (!value || typeof value !== 'object') return;
    visit(value);
    Object.values(value).forEach(child => walkObjects(child, visit));
};

const extractPage = data => {
    const videos = [];
    const continuationTokens = [];

    walkObjects(data, value => {
        const video = value.lockupViewModel;
        if (video?.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
            const metadata = video.metadata?.lockupMetadataViewModel;
            videos.push({
                id: video.contentId,
                title: metadata?.title?.content || '',
                thumbnail: video.contentImage?.thumbnailViewModel?.image?.sources?.at(-1)?.url || '',
            });
        }

        const continuation = value.continuationItemViewModel
            ?.continuationCommand?.innertubeCommand?.continuationCommand;
        if (continuation?.token) continuationTokens.push(continuation.token);
    });

    return { videos, continuationToken: continuationTokens[0] };
};

const parseInitialPage = html => {
    const marker = 'var ytInitialData = ';
    const start = html.indexOf(marker);
    const end = start === -1 ? -1 : html.indexOf(';</script>', start);
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":("(?:[^"\\]|\\.)*")/);
    const contextMatch = html.match(/"INNERTUBE_CONTEXT":(\{.*?\}),"INNERTUBE_CONTEXT_CLIENT_NAME"/);

    if (start === -1 || end === -1 || !apiKeyMatch || !contextMatch) {
        throw new Error('YouTube playlist metadata format was not recognized.');
    }

    return {
        data: JSON.parse(html.slice(start + marker.length, end)),
        apiKey: JSON.parse(apiKeyMatch[1]),
        context: JSON.parse(contextMatch[1]),
    };
};

export const fetchPlaylistVideos = async playlistId => {
    const playlistUrl = `${YOUTUBE_ORIGIN}/playlist?list=${playlistId}`;
    const response = await fetch(playlistUrl, { headers: REQUEST_HEADERS });
    if (!response.ok) {
        throw new Error(`YouTube playlist request failed with HTTP ${response.status}.`);
    }

    const initial = parseInitialPage(await response.text());
    const videosById = new Map();
    const seenTokens = new Set();
    let data = initial.data;

    while (data) {
        const page = extractPage(data);
        page.videos.forEach(video => videosById.set(video.id, video));

        if (!page.continuationToken || seenTokens.has(page.continuationToken)) break;
        seenTokens.add(page.continuationToken);

        const continuationResponse = await fetch(
            `${YOUTUBE_ORIGIN}/youtubei/v1/browse?key=${initial.apiKey}`,
            {
                method: 'POST',
                headers: REQUEST_HEADERS,
                body: JSON.stringify({
                    context: initial.context,
                    continuation: page.continuationToken,
                }),
            }
        );
        if (!continuationResponse.ok) {
            throw new Error(`YouTube playlist continuation failed with HTTP ${continuationResponse.status}.`);
        }
        data = await continuationResponse.json();
    }

    return [...videosById.values()];
};

export const buildVideoCatalog = sourceResults => {
    const videos = {};

    sourceResults.forEach(({ source, items }) => {
        items.forEach(video => {
            extractProblemIds(video.title).forEach(problemId => {
                if (videos[problemId]) return;
                videos[problemId] = {
                    title: video.title,
                    videoUrl: `${YOUTUBE_ORIGIN}/watch?v=${video.id}`,
                    videoThumbnail: video.thumbnail,
                    channel: source.channel,
                    playlistUrl: `${YOUTUBE_ORIGIN}/playlist?list=${source.playlistId}`,
                };
            });
        });
    });

    return {
        available: true,
        sourceCount: sourceResults.length,
        videoCount: Object.keys(videos).length,
        sources: sourceResults.map(({ source, items }) => ({
            ...source,
            playlistUrl: `${YOUTUBE_ORIGIN}/playlist?list=${source.playlistId}`,
            videoCount: items.length,
        })),
        videos,
    };
};

export const syncVideoCatalog = async outputFile => {
    const sourceResults = [];
    for (const source of VIDEO_SOURCES) {
        const items = await fetchPlaylistVideos(source.playlistId);
        sourceResults.push({ source, items });
        console.log(`Fetched ${items.length} videos from ${source.name}.`);
    }

    const catalog = buildVideoCatalog(sourceResults);
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, `${JSON.stringify(catalog)}\n`);
    return catalog;
};

const isCli = process.argv[1] &&
    pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isCli) {
    const outputFile = process.argv[2]
        ? path.resolve(process.argv[2])
        : path.resolve('.cache/videos.json');

    try {
        const catalog = await syncVideoCatalog(outputFile);
        console.log(`Created ${outputFile} with ${catalog.videoCount} problem-video matches.`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}
