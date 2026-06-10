import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;

    // 1. 添加用户消息
    setMessages(prev => [
      ...prev,
      { role: "user", text: userText }
    ]);

    setInput("");

    // 2. 先加一个空AI消息（用于流式更新）
    setMessages(prev => [
      ...prev,
      { role: "assistant", text: "" }
    ]);

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userText,
          history: messages
        })
      });

      // 3. 流式读取
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let aiText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        aiText += decoder.decode(value, { stream: true });

        // 实时更新最后一条AI消息
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            text: aiText
          };
          return copy;
        });
      }

    } catch (err) {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          text: "请求失败"
        };
        return copy;
      });
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2>AI客服系统</h2>

      <div style={{
        border: "1px solid #ddd",
        height: 400,
        overflowY: "auto",
        padding: 10
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ margin: "10px 0" }}>
            <b>{msg.role === "user" ? "用户" : "AI"}：</b>
            {msg.text}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", marginTop: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: 10 }}
          placeholder="请输入问题..."
        />

        <button onClick={sendMessage} disabled={loading}>
          {loading ? "生成中..." : "发送"}
        </button>
      </div>
    </div>
  );
}

export default App;