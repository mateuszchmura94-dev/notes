document.addEventListener('DOMContentLoaded', () => {
  // Potwierdzenie usunięcia elementu
  const deleteForms = document.querySelectorAll('form[action*="/delete"]');
  deleteForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const confirmed = confirm('Czy na pewno chcesz usunąć ten element?');
      if (!confirmed) {
        e.preventDefault();
      }
    });
  });
});