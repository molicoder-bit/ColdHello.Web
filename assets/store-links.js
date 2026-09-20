// Add each public listing URL when it exists. Badges stay hidden while blank,
// so the site never sends visitors to a placeholder or claims availability.
const storeLinks = {
  apple: 'https://apps.apple.com/app/id6803632299',
  google: '',
};

for (const link of document.querySelectorAll('[data-store]')) {
  const url = storeLinks[link.dataset.store];
  if (!url) continue;
  link.href = url;
  link.hidden = false;
  link.rel = 'noopener';
}
