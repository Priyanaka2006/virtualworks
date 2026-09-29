const noteInput = document.getElementById("noteInput");
const saveButton = document.getElementById("saveButton");
const notesList = document.getElementById("notesList");
const message = document.getElementById("message");

async function loadNotes() {
  try {
    const response = await fetch("/api/notes");
    const notes = await response.json();

    notesList.innerHTML = "";

    if (notes.length === 0) {
      notesList.innerHTML = '<p class="empty">No notes saved yet.</p>';
      return;
    }

    notes.forEach(addNoteToPage);
  } catch (error) {
    notesList.innerHTML = '<p class="empty">Could not load notes.</p>';
  }
}

function addNoteToPage(note) {
  const noteElement = document.createElement("div");
  noteElement.className = "note";

  const content = document.createElement("div");
  content.className = "note-content";
  content.textContent = note.content;

  const time = document.createElement("div");
  time.className = "note-time";
  time.textContent = `Created: ${note.created_at}`;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.textContent = "Delete";

  deleteButton.addEventListener("click", () => {
    deleteNote(note.id);
  });

  noteElement.appendChild(content);
  noteElement.appendChild(time);
  noteElement.appendChild(deleteButton);

  notesList.appendChild(noteElement);
}

saveButton.addEventListener("click", async () => {
  const content = noteInput.value.trim();

  if (!content) {
    message.textContent = "Please write a note first.";
    return;
  }

  saveButton.disabled = true;

  try {
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: content,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      message.textContent = data.error || "Could not save note.";
      return;
    }

    message.textContent = "Note saved successfully!";
    noteInput.value = "";

    await loadNotes();
  } catch (error) {
    message.textContent = "Server error. Is the Python app running?";
  } finally {
    saveButton.disabled = false;
  }
});

async function deleteNote(id) {
  try {
    const response = await fetch(`/api/notes/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      await loadNotes();
    }
  } catch (error) {
    message.textContent = "Could not delete note.";
  }
}

loadNotes();
