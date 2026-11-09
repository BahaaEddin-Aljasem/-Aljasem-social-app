export interface PostUser {
  _id: string;
  name: string;
  username?: string;
  photo?: string;
}

export interface PostType {
  _id: string;
  body?: string;
  image?: string;
  video?: string;
  privacy?: "public" | "followers" | "private";
  user: PostUser;
  createdAt: string;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
}
