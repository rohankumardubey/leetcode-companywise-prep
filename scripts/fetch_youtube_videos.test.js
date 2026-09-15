import { describe, expect, it } from 'vitest';
import { buildVideoCatalog } from './fetch_youtube_videos';

describe('YouTube video catalog', () => {
    it('maps exact LeetCode IDs and preserves source attribution', () => {
        const source = {
            name: 'SQL explanations',
            channel: 'Example Channel',
            playlistId: 'playlist-1',
        };
        const catalog = buildVideoCatalog([{
            source,
            items: [
                {
                    id: 'video-175',
                    title: 'LeetCode 175 - Combine Two Tables',
                    thumbnail: 'https://example.com/175.jpg',
                },
                {
                    id: 'unmatched',
                    title: 'SQL joins explained',
                    thumbnail: '',
                },
            ],
        }]);

        expect(catalog.videoCount).toBe(1);
        expect(catalog.videos['175']).toEqual({
            title: 'LeetCode 175 - Combine Two Tables',
            videoUrl: 'https://www.youtube.com/watch?v=video-175',
            videoThumbnail: 'https://example.com/175.jpg',
            channel: 'Example Channel',
            playlistUrl: 'https://www.youtube.com/playlist?list=playlist-1',
        });
        expect(catalog.sources[0]).toMatchObject({
            channel: 'Example Channel',
            videoCount: 2,
        });
    });
});
