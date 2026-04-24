import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import { fetchFeed, toggleLike, addComment, toggleSave, toggleFollow } from '../services/postService';
import { fetchNotifications, markNotificationsRead } from '../services/notificationService';
import RightSidebar from '../components/RightSidebar';
import PostComposer from '../components/PostComposer';
import FeedList from '../components/FeedList';
import StoriesTray from '../components/StoriesTray';

export default function FeedPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState([]);

  // ─── Feed loading with React Query ──────────────────────────────────────────

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => fetchFeed({ cursor: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ─── Notifications ───────────────────────────────────────────────────────────

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: !!user,
  });

  useEffect(() => {
    if (notificationsData) setNotifications(notificationsData);
  }, [notificationsData]);

  useSocket(user?.id, (notif) => {
    setNotifications((prev) => [notif, ...prev]);
  });

  const markRead = async () => {
    await markNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // ─── Post mutations with Optimistic Updates ──────────────────────────────────

  const likeMutation = useMutation({
    mutationFn: ({ postId }) => toggleLike(postId),
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previousData = queryClient.getQueryData(['feed']);

      queryClient.setQueryData(['feed'], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p.id === postId
                ? { 
                    ...p, 
                    likedByMe: !isLiked, 
                    likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1 
                  }
                : p
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['feed'], context.previousData);
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, text }) => addComment(postId, text),
    onSuccess: (newComment, { postId }) => {
      queryClient.setQueryData(['feed'], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p.id === postId 
                ? { ...p, comments: [...p.comments, newComment] } 
                : p
            ),
          })),
        };
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ postId }) => toggleSave(postId),
    onMutate: async ({ postId, isSaved }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previousData = queryClient.getQueryData(['feed']);

      queryClient.setQueryData(['feed'], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p.id === postId ? { ...p, savedByMe: !isSaved } : p
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['feed'], context.previousData);
    },
  });

  const handleLike = (postId, isLiked) => likeMutation.mutate({ postId, isLiked });
  const handleComment = (postId, text) => commentMutation.mutate({ postId, text });
  const handleSave = (postId, isSaved) => saveMutation.mutate({ postId, isSaved });
  const handleFollow = (authorId) => toggleFollow(authorId);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <main className="feed-column">
        <StoriesTray />
        
        <PostComposer onCreated={() => refetch()} />

        {isLoading ? (
          <p className="card" style={{ textAlign: 'center', color: '#8e8e8e' }}>
            Loading feed…
          </p>
        ) : isError ? (
          <p className="card" style={{ textAlign: 'center', color: 'red' }}>
            Failed to load feed.
          </p>
        ) : (
          <FeedList
            posts={posts}
            currentUser={user}
            onLike={handleLike}
            onComment={handleComment}
            onSave={handleSave}
            onFollow={handleFollow}
          />
        )}

        {isFetchingNextPage && (
          <p style={{ textAlign: 'center', color: '#8e8e8e', padding: '16px' }}>
            Loading more…
          </p>
        )}

        {!isLoading && !hasNextPage && posts.length > 0 && (
          <p style={{ textAlign: 'center', color: '#8e8e8e', padding: '20px', fontSize: '14px' }}>
            You're all caught up
          </p>
        )}
      </main>

      <RightSidebar user={user} />
    </>
  );
}
