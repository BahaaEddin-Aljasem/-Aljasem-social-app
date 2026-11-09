export interface ProfileUser {
  _id: string;
  name: string;
  username?: string;
  email?: string;
  photo?: string;
  coverPhoto?: string;
  gender?: string;
  dateOfBirth?: string;
  createdAt?: string;
  followersCount?: number;
  followingCount?: number;
  bookmarksCount?: number;
}
