import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSocket } from '../../services/socket';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import NewMessageModal from './NewMessageModal';
import styles from './DMList.module.css';

const TABS = ['Primary', 'General', 'Requests'];

function formatTimestamp(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  const w = Math.floor(d / 7);
  if (h < 1) return 'now';
  if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`;
  if (w < 5) return `${w}w`;
  return `${Math.floor(w / 4)}mo`;
}

export default function DMList({ activeConversationId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const socket = getSocket();

  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState('Primary');
  const [searchQuery, setSearchQuery] = useState('');
  const [yourNote, setYourNote] = useState(() => localStorage.getItem('ig_note') || '');
  const [editingNote, setEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const noteInputRef = useRef(null);

  // Note comment modal
  const [commentingNote, setCommentingNote] = useState(null); // { id, label, note }
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef(null);

  // Conversation hover actions
  const [hoveredConvId, setHoveredConvId] = useState(null);
  const [menuConvId, setMenuConvId] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/messages/conversations');
        setConversations(res.data.conversations || []);
      } catch (e) {
        console.error('Failed to fetch conversations:', e);
      }
    };

    fetchConversations();

    if (socket) {
      socket.on('new_message', (data) => {
        setConversations(prev => {
          const idx = prev.findIndex(c => c.id === data.conversationId);
          if (idx === -1) { fetchConversations(); return prev; }
          const updated = [...prev];
          const conv = { ...updated[idx], lastMessage: data.message.content || 'Attachment', lastMessageAt: data.message.createdAt };
          if (data.message.senderId !== socket.userId) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }
          updated.splice(idx, 1);
          return [conv, ...updated];
        });
      });

      socket.on('messages_read', ({ conversationId }) => {
        setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
      });
    }

    return () => {
      if (socket) {
        socket.off('new_message');
        socket.off('messages_read');
      }
    };
  }, [socket]);

  const saveNote = () => {
    localStorage.setItem('ig_note', noteInput.trim());
    setYourNote(noteInput.trim());
    setEditingNote(false);
  };

  const openNoteEdit = () => {
    setNoteInput(yourNote);
    setEditingNote(true);
    setTimeout(() => noteInputRef.current?.focus(), 50);
  };

  // Note comment handlers
  const openNoteComment = (n) => {
    setCommentingNote(n);
    setCommentText('');
    setTimeout(() => commentInputRef.current?.focus(), 50);
  };

  const postNoteComment = () => {
    if (!commentText.trim()) return;
    // Replying to a note navigates to that DM conversation (same as Instagram)
    navigate(`/messages/${commentingNote.id}`);
    setCommentingNote(null);
  };

  // Conversation action handlers
  useEffect(() => {
    if (!menuConvId) return;
    const close = () => setMenuConvId(null);
    const timer = setTimeout(() => document.addEventListener('click', close), 0);
    return () => { clearTimeout(timer); document.removeEventListener('click', close); };
  }, [menuConvId]);

  const handleMuteConv = useCallback((e, convId) => {
    e.preventDefault();
    e.stopPropagation();
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, isMuted: !c.isMuted } : c));
    setMenuConvId(null);
  }, []);

  const handleMarkUnread = useCallback((e, convId) => {
    e.preventDefault();
    e.stopPropagation();
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, unreadCount: (c.unreadCount || 0) > 0 ? 0 : 1 } : c
    ));
    setMenuConvId(null);
  }, []);

  const handleDeleteConv = useCallback((e, convId) => {
    e.preventDefault();
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== convId));
    setMenuConvId(null);
  }, []);

  const filtered = conversations.filter(c => {
    const name = c.isGroup ? (c.groupName || '') : (c.otherUser?.username || '');
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const tabConvs = activeTab === 'Primary'
    ? filtered.filter(c => !c.isGroup)
    : activeTab === 'General'
      ? filtered.filter(c => !!c.isGroup)
      : [];

  // Notes row: your note first, then conversation partners
  const notePeople = [
    { id: '__own', avatar: user?.avatarUrl, label: 'Your note', note: yourNote, isOwn: true },
    ...conversations.slice(0, 8).map(c => ({
      id: c.id,
      avatar: c.otherUser?.avatarUrl,
      label: c.otherUser?.username || 'Chat',
      note: c.lastMessage?.substring(0, 18) || '',
      isOwn: false,
    }))
  ];

  return (
    <>
      <div className={styles.dmList}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.usernameArea} onClick={() => {}}>
            <span className={styles.usernameText}>{user?.username || 'Messages'}</span>
            <span className={styles.chevron}>⌄</span>
          </button>
          <button className={styles.newMsgBtn} onClick={() => setShowNewMessage(true)} title="New message">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className={styles.searchWrap}>
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {activeTab === 'Requests' ? (
          <RequestsPane />
        ) : (
          <div className={styles.scrollArea}>
            {/* Notes row */}
            <div className={styles.notesRow}>
              {notePeople.map(n => (
                <div key={n.id} className={styles.noteItem}>
                  {n.isOwn ? (
                    <button className={styles.noteAvatarWrap} onClick={openNoteEdit}>
                      <div className={styles.noteBubbleArea}>
                        {n.note && <div className={styles.noteBubble}>{n.note.substring(0, 16)}</div>}
                      </div>
                      <div className={styles.noteRingWrap}>
                        <div className={styles.noteRing}>
                          <img
                            src={n.avatar || '/default-avatar.png'}
                            className={styles.noteAvatar}
                            alt="you"
                            onError={e => { e.target.src = '/default-avatar.png'; }}
                          />
                        </div>
                        {!n.note && <div className={styles.addNoteIcon}>+</div>}
                      </div>
                    </button>
                  ) : (
                    <button
                      className={styles.noteAvatarWrap}
                      onClick={() => n.note ? openNoteComment(n) : navigate(`/messages/${n.id}`)}
                    >
                      <div className={styles.noteBubbleArea}>
                        {n.note && <div className={styles.noteBubble}>{n.note}</div>}
                      </div>
                      <div className={styles.noteRingWrap}>
                        <div className={styles.noteRingFriend}>
                          <img
                            src={n.avatar || '/default-avatar.png'}
                            className={styles.noteAvatar}
                            alt={n.label}
                            onError={e => { e.target.src = '/default-avatar.png'; }}
                          />
                        </div>
                      </div>
                    </button>
                  )}
                  <span className={styles.noteLabel}>{n.label}</span>
                </div>
              ))}
            </div>

            {/* Conversation list */}
            <div className={styles.convList}>
              {tabConvs.length === 0 ? (
                <div className={styles.empty}>
                  <p>No conversations yet.</p>
                </div>
              ) : (
                tabConvs.map(conv => {
                  const name = conv.isGroup
                    ? (conv.groupName || 'Group Chat')
                    : (conv.otherUser?.username || 'Unknown');
                  const avatar = conv.isGroup ? null : conv.otherUser?.avatarUrl;
                  const isActive = conv.id === activeConversationId;
                  const hasUnread = (conv.unreadCount || 0) > 0;
                  const isHovered = hoveredConvId === conv.id;
                  const menuOpen = menuConvId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      className={styles.convItemWrap}
                      onMouseEnter={() => setHoveredConvId(conv.id)}
                      onMouseLeave={() => setHoveredConvId(null)}
                    >
                      <Link
                        to={`/messages/${conv.id}`}
                        className={`${styles.convItem} ${isActive ? styles.convItemActive : ''} ${conv.isMuted ? styles.convItemMuted : ''}`}
                      >
                        <div className={styles.avatarWrap}>
                          <img
                            src={avatar || '/default-avatar.png'}
                            className={styles.convAvatar}
                            alt={name}
                            onError={e => { e.target.src = '/default-avatar.png'; }}
                          />
                        </div>
                        <div className={styles.convBody}>
                          <span className={`${styles.convName} ${hasUnread ? styles.bold : ''}`}>{name}</span>
                          <span className={`${styles.convLast} ${hasUnread ? styles.bold : ''}`}>
                            {conv.isMuted && <span className={styles.mutedTag}>Muted · </span>}
                            {conv.lastMessage?.substring(0, 35) || 'Tap to chat'}
                            {conv.lastMessageAt ? ` · ${formatTimestamp(conv.lastMessageAt || conv.updatedAt)}` : ''}
                          </span>
                        </div>
                        <div className={styles.convRight}>
                          {hasUnread && !isHovered && <span className={styles.unreadDot} />}
                        </div>
                      </Link>

                      {isHovered && (
                        <div className={styles.hoverActions}>
                          <button
                            className={styles.hoverBtn}
                            title={conv.isMuted ? 'Unmute' : 'Mute'}
                            onClick={(e) => handleMuteConv(e, conv.id)}
                          >
                            {conv.isMuted ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                              </svg>
                            )}
                          </button>
                          <button
                            className={styles.hoverBtn}
                            title="More options"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuConvId(menuOpen ? null : conv.id); }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {menuOpen && (
                        <div className={styles.convMenu} onClick={e => e.stopPropagation()}>
                          <button className={styles.convMenuItem} onClick={(e) => handleMarkUnread(e, conv.id)}>
                            {hasUnread ? 'Mark as read' : 'Mark as unread'}
                          </button>
                          <button className={styles.convMenuItem} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuConvId(null); }}>
                            Unpin
                          </button>
                          <button className={styles.convMenuItem} onClick={(e) => handleMuteConv(e, conv.id)}>
                            {conv.isMuted ? 'Unmute' : 'Mute'}
                          </button>
                          <button className={`${styles.convMenuItem} ${styles.convMenuDelete}`} onClick={(e) => handleDeleteConv(e, conv.id)}>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Note edit overlay */}
      {editingNote && (
        <div className={styles.noteOverlay} onClick={() => setEditingNote(false)}>
          <div className={styles.noteEditBox} onClick={e => e.stopPropagation()}>
            <div className={styles.noteEditAvatar}>
              <img src={user?.avatarUrl || '/default-avatar.png'} alt="" onError={e => { e.target.src = '/default-avatar.png'; }} />
            </div>
            <p className={styles.noteEditHint}>Share a note with your followers and following</p>
            <textarea
              ref={noteInputRef}
              className={styles.noteEditInput}
              value={noteInput}
              onChange={e => setNoteInput(e.target.value.slice(0, 60))}
              placeholder="Share a thought..."
              rows={2}
              maxLength={60}
            />
            <div className={styles.noteEditCount}>{noteInput.length}/60</div>
            <div className={styles.noteEditActions}>
              <button className={styles.noteEditCancel} onClick={() => setEditingNote(false)}>Cancel</button>
              <button className={styles.noteEditShare} onClick={saveNote}>Share</button>
            </div>
          </div>
        </div>
      )}

      {commentingNote && (
        <div className={styles.noteOverlay} onClick={() => setCommentingNote(null)}>
          <div className={styles.noteEditBox} onClick={e => e.stopPropagation()}>
            <div className={styles.noteEditAvatar}>
              <img
                src={commentingNote.avatar || '/default-avatar.png'}
                alt={commentingNote.label}
                onError={e => { e.target.src = '/default-avatar.png'; }}
              />
            </div>
            <p className={styles.noteCommentTitle}>Reply to {commentingNote.label}'s note</p>
            <p className={styles.noteCommentQuote}>"{commentingNote.note}"</p>
            <textarea
              ref={commentInputRef}
              className={styles.noteEditInput}
              value={commentText}
              onChange={e => setCommentText(e.target.value.slice(0, 60))}
              placeholder="Write a reply..."
              rows={2}
              maxLength={60}
            />
            <div className={styles.noteEditCount}>{commentText.length}/60</div>
            <div className={styles.noteEditActions}>
              <button className={styles.noteEditCancel} onClick={() => setCommentingNote(null)}>Cancel</button>
              <button
                className={styles.noteEditShare}
                style={!commentText.trim() ? { background: '#b2dffc' } : {}}
                disabled={!commentText.trim()}
                onClick={postNoteComment}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewMessage && (
        <NewMessageModal
          onClose={() => setShowNewMessage(false)}
          onStartChat={(convId) => {
            setShowNewMessage(false);
            navigate(`/messages/${convId}`);
          }}
        />
      )}
    </>
  );
}

function RequestsPane() {
  return (
    <div className={styles.requestsPane}>
      <div className={styles.requestsHiddenRow}>
        <div className={styles.hiddenIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        </div>
        <span className={styles.hiddenLabel}>Hidden Requests</span>
        <span className={styles.hiddenChevron}>›</span>
      </div>
      <p className={styles.requestsHint}>Chats will appear here after you send or receive a message</p>

      <div className={styles.requestsEmptyCenter}>
        <div className={styles.requestsCircle}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </div>
        <h3 className={styles.requestsTitle}>Message requests</h3>
        <p className={styles.requestsDesc}>These messages are from people you've restricted or don't follow. They won't know you viewed their request until you allow them to message you.</p>
      </div>

      <button className={styles.deleteAllBtn}>Delete all 0</button>
    </div>
  );
}
