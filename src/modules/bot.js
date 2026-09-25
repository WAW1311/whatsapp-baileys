const auth = require("../middlewares/auth");
const { pool } = require("../db");

function initBotRoutes(app) {
  // GET /api/bot — get bot status and all commands for the authenticated user
  app.get("/api/bot", auth, async (req, res) => {
    try {
      const userId = req.user.id;
      const [[user]] = await pool.query(
        "SELECT is_makeBot FROM users WHERE id = ?",
        [userId]
      );
      if (!user) return res.status(404).json({ status: false, response: "User not found" });

      const [commands] = await pool.query(
        "SELECT id, command, response, created_at FROM bot_commands WHERE user_id = ? ORDER BY created_at ASC",
        [userId]
      );

      return res.json({
        status: true,
        response: { is_makeBot: !!user.is_makeBot, commands },
      });
    } catch (e) {
      console.error("bot route error:", e);
      return res.status(500).json({ status: false, response: "Terjadi kesalahan server." });
    }
  });

  // PUT /api/bot/toggle — toggle is_makeBot for the authenticated user
  app.put("/api/bot/toggle", auth, async (req, res) => {
    try {
      const userId = req.user.id;
      const [[user]] = await pool.query(
        "SELECT is_makeBot FROM users WHERE id = ?",
        [userId]
      );
      if (!user) return res.status(404).json({ status: false, response: "User not found" });

      const newVal = user.is_makeBot ? 0 : 1;
      await pool.query("UPDATE users SET is_makeBot = ? WHERE id = ?", [newVal, userId]);

      return res.json({ status: true, response: { is_makeBot: !!newVal } });
    } catch (e) {
      console.error("bot route error:", e);
      return res.status(500).json({ status: false, response: "Terjadi kesalahan server." });
    }
  });

  // POST /api/bot/commands — add a new bot command
  app.post("/api/bot/commands", auth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { command, response: botResponse } = req.body;

      if (!command || !botResponse) {
        return res.status(400).json({ status: false, response: "command and response are required" });
      }

      const trimmedCommand = String(command).trim();
      const trimmedResponse = String(botResponse).trim();

      if (!trimmedCommand || !trimmedResponse) {
        return res.status(400).json({ status: false, response: "command and response cannot be empty" });
      }

      const [result] = await pool.query(
        "INSERT INTO bot_commands (user_id, command, response) VALUES (?, ?, ?)",
        [userId, trimmedCommand, trimmedResponse]
      );

      return res.status(201).json({
        status: true,
        response: {
          id: result.insertId,
          command: trimmedCommand,
          response: trimmedResponse,
        },
      });
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ status: false, response: "Command already exists" });
      }
      console.error("bot route error:", e);
      return res.status(500).json({ status: false, response: "Terjadi kesalahan server." });
    }
  });

  // PUT /api/bot/commands/:id — update an existing bot command
  app.put("/api/bot/commands/:id", auth, async (req, res) => {
    try {
      const userId = req.user.id;
      const commandId = req.params.id;
      const { command, response: botResponse } = req.body;

      if (!command || !botResponse) {
        return res.status(400).json({ status: false, response: "command and response are required" });
      }

      const trimmedCommand = String(command).trim();
      const trimmedResponse = String(botResponse).trim();

      if (!trimmedCommand || !trimmedResponse) {
        return res.status(400).json({ status: false, response: "command and response cannot be empty" });
      }

      const [result] = await pool.query(
        "UPDATE bot_commands SET command = ?, response = ? WHERE id = ? AND user_id = ?",
        [trimmedCommand, trimmedResponse, commandId, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ status: false, response: "Command not found" });
      }

      return res.json({
        status: true,
        response: { id: Number(commandId), command: trimmedCommand, response: trimmedResponse },
      });
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ status: false, response: "Command already exists" });
      }
      console.error("bot route error:", e);
      return res.status(500).json({ status: false, response: "Terjadi kesalahan server." });
    }
  });

  // DELETE /api/bot/commands/:id — delete a bot command
  app.delete("/api/bot/commands/:id", auth, async (req, res) => {
    try {
      const userId = req.user.id;
      const commandId = req.params.id;

      const [result] = await pool.query(
        "DELETE FROM bot_commands WHERE id = ? AND user_id = ?",
        [commandId, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ status: false, response: "Command not found" });
      }

      return res.json({ status: true, response: { message: "Command deleted" } });
    } catch (e) {
      console.error("bot route error:", e);
      return res.status(500).json({ status: false, response: "Terjadi kesalahan server." });
    }
  });
}

module.exports = { initBotRoutes };
