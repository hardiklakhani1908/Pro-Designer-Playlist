import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'channel',
      title: 'Channel',
      type: 'string',
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube URL',
      type: 'url',
      validation: (r) =>
        r
          .required()
          .uri({ scheme: ['http', 'https'] })
          .custom((value) => {
            if (!value) return true;
            const ok = /youtube\.com|youtu\.be/.test(value);
            return ok || 'Must be a YouTube URL';
          }),
    }),
    defineField({
      name: 'youtubeId',
      title: 'YouTube ID',
      type: 'string',
      description: 'The 11-char video ID. Can be derived from the URL.',
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail URL',
      type: 'url',
      description: 'Leave blank to auto-generate from YouTube ID.',
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'e.g. "12:34" or "1:02:45"',
    }),
    defineField({
      name: 'topic',
      title: 'Topic',
      type: 'reference',
      to: [{ type: 'topic' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Order of this video within its topic.',
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: 'Order (asc)',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'channel',
      media: 'thumbnail',
    },
  },
});
