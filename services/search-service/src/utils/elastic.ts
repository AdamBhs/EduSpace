import { Client } from "@elastic/elasticsearch";

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || "http://localhost:9200";
const INDEX_NAME = "posts";

export const elastic = new Client({ node: ELASTICSEARCH_URL });

const INDEX_SETTINGS = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
  },
  mappings: {
    properties: {
      postId: { type: "keyword" as const },
      classId: { type: "keyword" as const },
      chapterId: { type: "keyword" as const },
      authorId: { type: "keyword" as const },
      title: { type: "text" as const, analyzer: "standard" },
      content: { type: "text" as const, analyzer: "standard" },
      type: { type: "keyword" as const },
      studyMaterialType: { type: "keyword" as const },
      attachmentNames: { type: "text" as const, analyzer: "standard" },
      createdAt: { type: "date" as const },
      updatedAt: { type: "date" as const },
    },
  },
};

export async function ensureIndex(): Promise<void> {
  const exists = await elastic.indices.exists({ index: INDEX_NAME });
  if (!exists) {
    await elastic.indices.create({
      index: INDEX_NAME,
      ...INDEX_SETTINGS,
    });
    console.log(`Created Elasticsearch index: ${INDEX_NAME}`);
  }
}

export interface PostDocument {
  postId: string;
  classId: string;
  chapterId: string;
  authorId: string;
  title: string;
  content?: string;
  type: string;
  studyMaterialType?: string;
  attachmentNames?: string[];
  createdAt: string;
  updatedAt: string;
}

export async function indexPost(doc: PostDocument): Promise<void> {
  await elastic.index({
    index: INDEX_NAME,
    id: doc.postId,
    document: doc,
  });
}

export async function updatePost(postId: string, partial: Partial<PostDocument>): Promise<void> {
  try {
    await elastic.update({
      index: INDEX_NAME,
      id: postId,
      doc: partial,
    });
  } catch (err: any) {
    if (err?.meta?.statusCode === 404) return;
    throw err;
  }
}

export async function removePost(postId: string): Promise<void> {
  try {
    await elastic.delete({ index: INDEX_NAME, id: postId });
  } catch (err: any) {
    if (err?.meta?.statusCode === 404) return;
    throw err;
  }
}

export async function removeByClass(classId: string): Promise<void> {
  await elastic.deleteByQuery({
    index: INDEX_NAME,
    query: { term: { classId } },
  });
}

export interface SearchParams {
  classId: string;
  query: string;
  type?: string;
  studyMaterialType?: string;
  chapterId?: string;
  dateFrom?: string;
  dateTo?: string;
  from?: number;
  size?: number;
}

export async function searchPosts(params: SearchParams) {
  const must: any[] = [
    { term: { classId: params.classId } },
    {
      multi_match: {
        query: params.query,
        fields: ["title^3", "content^2", "attachmentNames"],
        fuzziness: "AUTO",
      },
    },
  ];

  if (params.type) {
    must.push({ term: { type: params.type } });
  }
  if (params.studyMaterialType) {
    must.push({ term: { studyMaterialType: params.studyMaterialType } });
  }
  if (params.chapterId) {
    must.push({ term: { chapterId: params.chapterId } });
  }
  if (params.dateFrom || params.dateTo) {
    const range: any = {};
    if (params.dateFrom) range.gte = params.dateFrom;
    if (params.dateTo) range.lte = params.dateTo;
    must.push({ range: { createdAt: range } });
  }

  const result = await elastic.search({
    index: INDEX_NAME,
    query: { bool: { must } },
    from: params.from || 0,
    size: params.size || 20,
    highlight: {
      fields: {
        title: {},
        content: {},
        attachmentNames: {},
      },
    },
    sort: [{ _score: { order: "desc" as const } }, { createdAt: { order: "desc" as const } }],
  });

  return {
    total: typeof result.hits.total === "number"
      ? result.hits.total
      : result.hits.total?.value ?? 0,
    hits: result.hits.hits.map((hit: any) => ({
      ...hit._source,
      score: hit._score,
      highlights: hit.highlight,
    })),
  };
}
