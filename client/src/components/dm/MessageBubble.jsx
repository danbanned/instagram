import { useState } from 'react';
import styles from './MessageBubble.module.css';

export default function MessageBubble({ message, isOwn, onReply, onReact, onDelete, onVotePoll, onForward }) {
  const [showOptions, setShowOptions] = useState(false);

  const renderContent = () => {
    if (message.isDeleted) {
      return <span className={styles.deleted}>Message deleted</span>;
    }

    if (message.mediaUrl) {
      if (message.mediaType === 'image') {
        return <img src={message.mediaUrl} className={styles.mediaImage} alt="" />;
      }
      if (message.mediaType === 'video') {
        return <video src={message.mediaUrl} controls className={styles.mediaVideo} />;
      }
      if (message.mediaType === 'audio') {
        return <audio src={message.mediaUrl} controls className={styles.mediaAudio} />;
      }
    }

    if (message.poll) {
      return (
        <div className={styles.poll}>
          <h4 className={styles.pollQuestion}>{message.poll.question}</h4>
          <div className={styles.pollOptions}>
            {message.poll.options.map(opt => (
              <button 
                key={opt.id} 
                className={styles.pollOption}
                onClick={() => onVotePoll(opt.id)}
              >
                <span>{opt.text}</span>
                <span className={styles.voteCount}>{opt.voters?.length || 0}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return <div className={styles.text}>{message.content}</div>;
  };

  return (
    <div 
      className={`${styles.container} ${isOwn ? styles.own : styles.other}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <div className={styles.bubbleContainer}>
        {message.replyTo && (
          <div className={styles.replyRef}>
            <span className={styles.replySender}>{message.replyTo.sender?.username}</span>
            <p className={styles.replyContent}>{message.replyTo.content || 'Media'}</p>
          </div>
        )}
        
        <div className={styles.bubble}>
          {renderContent()}
          {message.isEdited && <span className={styles.edited}>edited</span>}
        </div>

        {message.reactions?.length > 0 && (
          <div className={styles.reactions}>
            {message.reactions.map((r, idx) => (
              <span key={idx} className={styles.reaction} title={r.user.username}>
                {r.reaction}
              </span>
            ))}
          </div>
        )}
      </div>

      {showOptions && !message.isDeleted && (
        <div className={styles.options}>
          <button onClick={() => onReply(message)} title="Reply">↩️</button>
          <button onClick={() => onReact(message.id, '❤️')} title="Love">❤️</button>
          <button onClick={() => onReact(message.id, '😂')} title="Haha">😂</button>
          <button onClick={() => onForward(message)} title="Forward">➡️</button>
          {isOwn && <button onClick={() => onDelete(message.id)} title="Delete">🗑️</button>}
        </div>
      )}

      <span className={styles.time}>
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
