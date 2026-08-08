import API_CLIENT from ".";

export type BlogPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: string | null;
  authorName?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
};

export type BlogAuthor = {
  _id?: string;
  name?: string;
  photo?: string;
};

export type BlogComment = {
  _id: string;
  body: string;
  createdAt?: string;
  author?: BlogAuthor;
  replies?: BlogComment[];
};

export type BlogEngagement = {
  blogId?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
};

export type BlogPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

const payload = <T,>(response: { data?: { data?: T } }): T =>
  response?.data?.data as T;

const listBlogs = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const query = new URLSearchParams();
  query.set("page", String(params?.page || 1));
  query.set("limit", String(params?.limit || 12));
  if (params?.search?.trim()) query.set("search", params.search.trim());
  const response = await API_CLIENT.makeGetRequest(`/blogs?${query.toString()}`);
  return payload<{ blogs: BlogPost[]; pagination: BlogPagination }>(response);
};

const getBlogBySlug = async (slugOrId: string) => {
  const response = await API_CLIENT.makeGetRequest(
    `/blogs/${encodeURIComponent(slugOrId)}`,
  );
  return payload<BlogPost>(response);
};

const getEngagement = async (slugOrId: string) => {
  const response = await API_CLIENT.makeGetRequest(
    `/blogs/${encodeURIComponent(slugOrId)}/engagement`,
  );
  return payload<BlogEngagement>(response);
};

const listComments = async (
  slugOrId: string,
  params?: { page?: number; limit?: number },
) => {
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const response = await API_CLIENT.makeGetRequest(
    `/blogs/${encodeURIComponent(slugOrId)}/comments?page=${page}&limit=${limit}`,
  );
  return payload<{ comments: BlogComment[]; pagination?: BlogPagination }>(
    response,
  );
};

const toggleLike = async (slugOrId: string) => {
  const response = await API_CLIENT.makePostRequest(
    `/blogs/${encodeURIComponent(slugOrId)}/like`,
  );
  return payload<{ likedByMe: boolean; likeCount: number }>(response);
};

const recordShare = async (slugOrId: string) => {
  const response = await API_CLIENT.makePostRequest(
    `/blogs/${encodeURIComponent(slugOrId)}/share`,
  );
  return payload<{ shareCount: number }>(response);
};

const createComment = async (slugOrId: string, body: string) => {
  const response = await API_CLIENT.makePostRequest(
    `/blogs/${encodeURIComponent(slugOrId)}/comments`,
    { body },
  );
  return payload<{ comment: BlogComment; commentCount: number }>(response);
};

const replyComment = async (
  slugOrId: string,
  commentId: string,
  body: string,
) => {
  const response = await API_CLIENT.makePostRequest(
    `/blogs/${encodeURIComponent(slugOrId)}/comments/${encodeURIComponent(commentId)}/replies`,
    { body },
  );
  return payload<{ reply: BlogComment; commentCount: number }>(response);
};

const updateComment = async (
  slugOrId: string,
  commentId: string,
  body: string,
) => {
  const response = await API_CLIENT.makePatchRequest(
    `/blogs/${encodeURIComponent(slugOrId)}/comments/${encodeURIComponent(commentId)}`,
    { body },
  );
  return payload<{ comment: BlogComment }>(response);
};

const deleteComment = async (slugOrId: string, commentId: string) => {
  const response = await API_CLIENT.makeDeleteRequest(
    `/blogs/${encodeURIComponent(slugOrId)}/comments/${encodeURIComponent(commentId)}`,
  );
  return payload<{ commentCount: number }>(response);
};

const BLOGS = {
  listBlogs,
  getBlogBySlug,
  getEngagement,
  listComments,
  toggleLike,
  recordShare,
  createComment,
  replyComment,
  updateComment,
  deleteComment,
};

export default BLOGS;
