import { createClient, type SanityClient } from '@sanity/client';

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID || '';
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';
const writeToken = import.meta.env.VITE_SANITY_WRITE_TOKEN || '';

export const isSanityConfigured = Boolean(projectId);
export const canWriteToSanity = Boolean(projectId && writeToken);

export const sanity: SanityClient | null = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2024-10-01',
      useCdn: true,
    })
  : null;

// Token-bearing client for mutations. NOTE: the token is bundled with the
// client. Acceptable behind an admin-only gate; for production prefer a
// serverless proxy so the token never ships to the browser.
export const sanityWrite: SanityClient | null = canWriteToSanity
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2024-10-01',
      useCdn: false,
      token: writeToken,
    })
  : null;

export interface SanityModule {
  _id: string;
  name: string;
  slug: string;
  emoji?: string;
  description?: string;
  order?: number;
}

export interface SanityTopic {
  _id: string;
  name: string;
  slug: string;
  moduleId: string;
  moduleName: string;
  order?: number;
}

export interface SanityVideo {
  _id: string;
  title: string;
  channel?: string;
  youtubeUrl: string;
  youtubeId?: string;
  thumbnail?: string;
  duration?: string;
  topicId: string;
  topicName: string;
  order?: number;
}

export const queries = {
  modules: `*[_type == "module"] | order(order asc, name asc) {
    _id,
    name,
    "slug": slug.current,
    emoji,
    description,
    order
  }`,
  topics: `*[_type == "topic"] | order(order asc, name asc) {
    _id,
    name,
    "slug": slug.current,
    "moduleId": module._ref,
    "moduleName": module->name,
    order
  }`,
  videos: `*[_type == "video"] | order(order asc, title asc) {
    _id,
    title,
    channel,
    "youtubeUrl": youtubeUrl,
    "youtubeId": youtubeId,
    thumbnail,
    duration,
    "topicId": topic._ref,
    "topicName": topic->name,
    order
  }`,
};

export async function fetchAll() {
  if (!sanity) {
    return { modules: [], topics: [], videos: [] };
  }
  const [modules, topics, videos] = await Promise.all([
    sanity.fetch<SanityModule[]>(queries.modules),
    sanity.fetch<SanityTopic[]>(queries.topics),
    sanity.fetch<SanityVideo[]>(queries.videos),
  ]);
  return { modules, topics, videos };
}

export interface CreateVideoInput {
  title: string;
  channel?: string;
  youtubeUrl: string;
  youtubeId?: string;
  thumbnail?: string;
  duration?: string;
  topicRef: string;
}

export async function createVideo(input: CreateVideoInput) {
  if (!sanityWrite) {
    throw new Error('Sanity write client not configured. Set VITE_SANITY_PROJECT_ID and VITE_SANITY_WRITE_TOKEN.');
  }
  return sanityWrite.create({
    _type: 'video',
    title: input.title,
    channel: input.channel,
    youtubeUrl: input.youtubeUrl,
    youtubeId: input.youtubeId,
    thumbnail: input.thumbnail,
    duration: input.duration,
    topic: { _type: 'reference', _ref: input.topicRef },
  });
}
