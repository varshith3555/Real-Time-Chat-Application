const Message = ({ message, isOwnMessage }) => {
    return (
      <div
        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} items-end gap-2`}
      >
        {/* Message bubble */}
        <div
          className={`
            max-w-[75%] p-3 rounded-2xl
            ${
              isOwnMessage
                ? "bg-primary/10 text-primary-content rounded-br-sm"
                : "bg-base-200/50 text-base-content rounded-bl-sm"
            }
          `}
        >
          <p className="text-sm break-words">{message.content}</p>
        </div>
  
        {/* Timestamp */}
        <span className="text-[10px] text-base-content/50">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    );
  };
  
  export default Message;