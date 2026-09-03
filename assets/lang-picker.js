// Progressive enhancement for the header language menu. The <details> element
// already opens, closes and takes keyboard focus without this file; these
// handlers only add the dismissal behaviour people expect from a dropdown.
for (const picker of document.querySelectorAll('.lang-picker')) {
  document.addEventListener('click', (event) => {
    if (picker.open && !picker.contains(event.target)) picker.open = false;
  });

  picker.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !picker.open) return;
    picker.open = false;
    picker.querySelector('summary').focus();
  });
}
