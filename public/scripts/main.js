async function deleteSong(id) {
  if (!confirm('Na pewno usunąć?')) return;

  try {
    const response = await fetch(`/delete/song/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (response.ok) {
      const el = document.getElementById(`song-${id}`);
      if (el) el.remove();
    } else {
      alert(data.message || 'Błąd podczas usuwania');
    }
  } catch (err) {
    console.error('Błąd:', err);
    alert('Błąd połączenia z serwerem');
  }
}

async function deleteAlbum(id) {
  if (!confirm('Na pewno usunąć?')) return;

  try {
    const response = await fetch(`/delete/album/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (response.ok) {
      const el = document.getElementById(`album-${id}`);
      if (el) el.remove();
    } else {
      alert(data.message || 'Błąd podczas usuwania');
    }
  } catch (err) {
    console.error('Błąd:', err);
    alert('Błąd połączenia z serwerem');
  }
}

async function deleteBand(id) {
  if (!confirm('Na pewno usunąć?')) return;

  try {
    const response = await fetch(`/delete/band/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (response.ok) {
      const el = document.getElementById(`band-${id}`);
      if (el) el.remove();
    } else {
      alert(data.message || 'Błąd podczas usuwania');
    }
  } catch (err) {
    console.error('Błąd:', err);
    alert('Błąd połączenia z serwerem');
  }
}

function openEditModal(id, type, name, score, note = '', bandId = '') {
  const modal = document.getElementById('editModal');
  
  document.getElementById('editId').value = id;
  document.getElementById('editType').value = type;
  document.getElementById('editName').value = name;
  document.getElementById('editScore').value = score;
  document.getElementById('editNote').value = note;
  document.getElementById('editBandId').value = bandId;
  
  document.getElementById('modalTitle').innerText = `Edytuj: ${name}`;
  
  modal.showModal();
}

function closeEditModal() {
  document.getElementById('editModal').close();
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Zapis z modala
  const editForm = document.getElementById('editForm');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = document.getElementById('editId').value;
      const type = document.getElementById('editType').value;
      const name = document.getElementById('editName').value;
      const score = document.getElementById('editScore').value;
      const note = document.getElementById('editNote').value;

      try {
        const response = await fetch(`/update/${type}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, score, note })
        });

        if (response.ok) {
          closeEditModal();
          window.location.reload(); 
        } else {
          alert('Błąd podczas zapisu zmian');
        }
      } catch (err) {
        console.error('Błąd:', err);
        alert('Błąd połączenia z serwerem');
      }
    });
  }


  const newBandForm = document.getElementById('newBandForm');
  if (newBandForm) {
    newBandForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addBand();
    });
  }


const newAlbumForm = document.getElementById('newAlbumForm');
  if (newAlbumForm) {
    newAlbumForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addAlbum();
    });
  }

  const newSongForm = document.getElementById('newSongForm');
  if (newSongForm) {
    newSongForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addSong();
    });
  }
});

async function addBand() {
  const bandName = document.getElementById('newName').value;
  const bandScore = document.getElementById('newScore').value;
  const bandNote = document.getElementById('newNote').value;
  
  try {
    const response = await fetch('/add/band', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bandName, bandScore, bandNote })
    });

    const data = await response.json();

    if (response.ok) {
      window.location.reload();
    } else {
      alert(data.message || 'Błąd podczas dodawania zespołu');
    }
  } catch (err) {
    console.error('Błąd połączenia:', err);
    alert('Nie udało się połączyć z serwerem');
  }
}



async function addAlbum() {
  const albumName = document.getElementById('newAlbumName').value;
  const albumScore = document.getElementById('newAlbumScore').value;
  const albumNote = document.getElementById('newAlbumNote').value;
  const bandId = document.getElementById('albumBandId').value;
  const bandName = document.getElementById('albumBandName').value;
  
  try {
    const response = await fetch('/add/album', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ albumName, albumScore, albumNote, bandId, bandName})
    });

    const data = await response.json();

    if (response.ok) {
      window.location.reload();
    } else {
      alert(data.message || 'Błąd podczas dodawania płyty');
    }
  } catch (err) {
    console.error('Błąd połączenia:', err);
    alert('Nie udało się połączyć z serwerem');
  }
}


async function addSong() {
  const songName = document.getElementById('newSongName').value;
  const songScore = document.getElementById('newSongScore').value;
  const albumId = document.getElementById('albumId').value;

  
  try {
    const response = await fetch('/add/song', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ songName, songScore, albumId })
    });

    const data = await response.json();

    if (response.ok) {
      window.location.reload();
    } else {
      alert(data.message || 'Błąd podczas dodawania utworu');
    }
  } catch (err) {
    console.error('Błąd połączenia:', err);
    alert('Nie udało się połączyć z serwerem');
  }
}
