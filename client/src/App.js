import "./App.css";
import io from "socket.io-client";
import { useEffect, useState, useRef } from "react";

const socket = io.connect("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("");
  const [isUsernameSet, setIsUsernameSet] = useState(false);

  const [room, setRoom] = useState("");
  const [isRoomSet, setIsRoomSet] = useState(false);

  const [message, setMessage] = useState("");
  const [messageReceived, setMessageReceived] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);

  const [userColor, setUserColor] = useState(""); // NEW

  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageReceived]);

  // Socket listeners
  useEffect(() => {
    const handleReceiveMessage = (data) => {
      setMessageReceived((prev) => [...prev, data]);
    };

    const handleUpdateUsers = (users) => {
      setActiveUsers(users);
    };

    const handleAssignedColor = (color) => {
      setUserColor(color);
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("update_user_list", handleUpdateUsers);
    socket.on("assigned_color", handleAssignedColor);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("update_user_list", handleUpdateUsers);
      socket.off("assigned_color", handleAssignedColor);
    };
  }, []);

  const handleSetUsername = () => {
    if (username.trim() === "") return;
    setIsUsernameSet(true);
  };

  const handleSetRoom = () => {
    if (room.trim() === "") return;
    socket.emit("join_room", { room, username });
    setIsRoomSet(true);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const msgData = { username, room, message };

    socket.emit("send_message", msgData);
    setMessage("");
  };

  // Username screen
  if (!isUsernameSet) {
    return (
      <div className="App username-screen">
        <h2>Enter Username</h2>
        <input
          value={username}
          placeholder="Username..."
          onChange={(e) => setUsername(e.target.value)}
        />
        <button onClick={handleSetUsername}>Continue</button>
      </div>
    );
  }

  // Room selection screen
  if (!isRoomSet) {
    return (
      <div className="App room-screen">
        <h2>Welcome, {username}!</h2>
        <input
          value={room}
          placeholder="Room..."
          onChange={(e) => setRoom(e.target.value)}
        />
        <button onClick={handleSetRoom}>Join Room</button>
      </div>
    );
  }

  // Chat screen
  return (
    <div className="App chat-screen">
      <div className="chat-container">
        <div className="sidebar">
          <h3>Active Users</h3>
          <ul>
            {activeUsers.map((user) => (
              <li key={user.id}>{user.username}</li>
            ))}
          </ul>
        </div>

        <div className="chat-box">
          <div className="messages">
            {messageReceived.map((msg, idx) => {
              const prev = messageReceived[idx - 1];
              const isSameUser = prev && prev.username === msg.username;

              return (
                <div
                  key={idx}
                  className={`msg-wrapper ${
                    msg.username === username ? "my-wrapper" : "other-wrapper"
                  }`}
                >
                  {/* Show username ONLY when new group starts */}
                  {!isSameUser && (
                    <div
                      className="msg-username"
                      style={{ color: msg.color || "#555" }}
                    >
                      {msg.username}
                    </div>
                  )}

                  <div
                    className={`message-bubble ${
                      msg.username === username ? "my-msg" : "other-msg"
                    }`}
                    style={{
                      borderLeftColor: msg.color || "#888",
                    }}
                  >
                    <div className="msg-top">
                      <span className="msg-time">{msg.time}</span>
                    </div>

                    <div className="msg-text">{msg.message}</div>
                  </div>
                </div>
              );
            })}

            {/* FIXED TYPO */}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-box">
            <input
              value={message}
              placeholder="Type a message..."
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
