
'use strict';

const STORAGE_KEY = 'pawconnect_user_pets';
const PLACEHOLDER_IMAGE = 'images/placeholder.svg';

const NAV_LINKS = [
  { id: 'home', href: 'index.html', label: 'Home' },
  { id: 'adopt', href: 'adopt.html', label: 'Adopt a Pet' },
  { id: 'list', href: 'list-pet.html', label: 'List a Pet' },
  { id: 'about', href: 'about.html', label: 'About Us' },
  { id: 'contact', href: 'contact.html', label: 'Contact Us' }
];

const PAW_PATH = '<path d="M32 30c-8 0-15 8-15 14 0 5 4 7 8 6 3-1 5-2 7-2s4 1 7 2c4 1 8-1 8-6 0-6-7-14-15-14z"/>' +
  '<ellipse cx="17" cy="27" rx="4.5" ry="6" transform="rotate(-20 17 27)"/>' +
  '<ellipse cx="27" cy="18" rx="4.5" ry="6.5"/><ellipse cx="37" cy="18" rx="4.5" ry="6.5"/>' +
  '<ellipse cx="47" cy="27" rx="4.5" ry="6" transform="rotate(20 47 27)"/>';

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

function formatAge(months) {
  months = Number(months);
  if (months < 12) return months + (months === 1 ? ' month' : ' months');
  const years = Math.round((months / 12) * 10) / 10;
  return years + (years === 1 ? ' year' : ' years');
}

function getAgeCategory(months) {
  months = Number(months);
  if (months < 12) return 'Baby';
  if (months < 36) return 'Young';
  if (months < 96) return 'Adult';
  return 'Senior';
}

function fillSelect(select, options, firstLabel) {
  select.innerHTML = '<option value="">' + escapeHtml(firstLabel) + '</option>' +
    options.map(function (o) {
      const value = typeof o === 'string' ? o : o.value;
      const label = typeof o === 'string' ? o : o.label;
      return '<option value="' + escapeHtml(value) + '">' + escapeHtml(label) + '</option>';
    }).join('');
}


function resizeImage(file, maxSize, quality) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onerror = function () { reject(new Error('Could not read file')); };
    reader.onload = function () {
      const img = new Image();
      img.onerror = function () { reject(new Error('Could not decode image')); };
      img.onload = function () {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function isStorageAvailable() {
  try {
    const key = '__pawconnect_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    return false;
  }
}

function isValidPet(pet) {
  return pet && typeof pet === 'object' &&
    typeof pet.id === 'string' && typeof pet.name === 'string' &&
    typeof pet.type === 'string' && typeof pet.breed === 'string' &&
    typeof pet.location === 'string' && Number.isFinite(Number(pet.ageMonths));
}

function loadUserPets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidPet).map(function (pet) {
      return Object.assign({ status: 'Available', description: '' }, pet, { isSample: false });
    });
  } catch (err) {
    console.warn('PawConnect: could not read saved listings.', err);
    return [];
  }
}

function saveUserPets(pets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
    return true;
  } catch (err) {
    console.warn('PawConnect: could not save listings.', err);
    return false;
  }
}

function removeUserPet(id) {
  const remaining = loadUserPets().filter(function (pet) { return pet.id !== id; });
  return saveUserPets(remaining);
}

function getAllPets() {
  return loadUserPets().concat(samplePets);
}

function getPetById(id) {
  return getAllPets().find(function (pet) { return pet.id === id; }) || null;
}

function renderLayout() {
  const current = document.body.dataset.page;
  const headerBox = document.getElementById('site-header');
  const footerBox = document.getElementById('site-footer');

  if (headerBox) {
    const links = NAV_LINKS.map(function (link) {
      return '<li><a href="' + link.href + '"' + (link.id === current ? ' aria-current="page"' : '') + '>' + link.label + '</a></li>';
    }).join('');
    headerBox.innerHTML =
      '<header class="site-header"><div class="container header__inner">' +
      '<a class="logo" href="index.html" aria-label="PawConnect home"><svg class="logo__icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' + PAW_PATH + '</svg><span>PawConnect</span></a>' +
      '<button class="nav-toggle" id="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav"><span class="sr-only">Menu</span><span class="nav-toggle__bars" aria-hidden="true"></span></button>' +
      '<nav id="main-nav" class="main-nav" aria-label="Main navigation"><ul>' + links + '</ul></nav>' +
      '</div></header>';
  }

  if (footerBox) {
    const footLinks = NAV_LINKS.map(function (link) {
      return '<li><a href="' + link.href + '">' + link.label + '</a></li>';
    }).join('');
    footerBox.innerHTML =
      '<footer class="site-footer"><div class="container"><div class="footer__grid">' +
      '<div><a class="logo" href="index.html"><svg class="logo__icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' + PAW_PATH + '</svg><span>PawConnect</span></a>' +
      '<p>Connecting Paws with Loving Homes.</p>' +
      '<p>Our mission is to make pet adoption easier to find, easier to understand and more responsible for every animal and every adopter.</p></div>' +
      '<div><h2>Explore</h2><ul>' + footLinks + '</ul></div>' +
      '<div><h2>Get in touch</h2><ul>' +
      '<li>Email:saishubhravallinaik@gmail.com</li><li>Phone: +91 91XXX XXX10</li><li>Address: davv , indore</li></ul>' +
      '<p class="hint" style="color:#d9d1b9;margin-top:0.5rem"></p>' +
      '<div class="social">' +
      '<a href="https://www.facebook.com" target="_blank" rel="noopener" aria-label="Facebook (opens in a new tab)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5v4h3v7h4v-7h3l1-4h-4V7.5c0-.3.2-.5.5-.5H15z"/></svg></a>' +
      '<a href="https://www.instagram.com" target="_blank" rel="noopener" aria-label="Instagram (opens in a new tab)"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6"/></svg></a>' +
      '<a href="https://x.com" target="_blank" rel="noopener" aria-label="X (opens in a new tab)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20"/></svg></a>' +
      '</div></div></div>' +
      '<div class="footer__bottom">&copy; ' + new Date().getFullYear() + ' PawConnect. A frontend college project. All pets marked &ldquo;Sample&rdquo; are fictional.</div>' +
      '</div></footer>';
  }
}

function setupNav() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if (!toggle || !nav) return;

  function closeMenu() {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', function () {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      closeMenu();
      toggle.focus();
    }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 820) closeMenu();
  });
}

document.addEventListener('error', function (e) {
  const el = e.target;
  if (el && el.tagName === 'IMG' && el.classList.contains('pet-img') && !el.dataset.fallback) {
    el.dataset.fallback = '1';
    el.src = PLACEHOLDER_IMAGE;
  }
}, true);

function renderPetCard(pet) {
  const status = pet.status || 'Available';
  const tag = pet.isSample
    ? '<span class="badge badge--tag">Sample</span>'
    : '<span class="badge badge--tag badge--yours">Your listing</span>';
  const alt = pet.imageAlt || ('Photo of ' + pet.name + ', a ' + pet.breed);
  return '<article class="pet-card">' +
    '<div class="pet-card__media">' +
    '<img class="pet-img" src="' + escapeHtml(pet.image || PLACEHOLDER_IMAGE) + '" alt="' + escapeHtml(alt) + '" loading="lazy">' +
    '<span class="badge badge--status badge--' + escapeHtml(status.toLowerCase()) + '">' + escapeHtml(status) + '</span>' + tag +
    '</div>' +
    '<div class="pet-card__body">' +
    '<h3>' + escapeHtml(pet.name) + '</h3>' +
    '<p class="pet-card__breed">' + escapeHtml(pet.breed) + '</p>' +
    '<ul class="pet-card__meta">' +
    '<li>Age: <span>' + escapeHtml(formatAge(pet.ageMonths)) + '</span></li>' +
    '<li>Type: <span>' + escapeHtml(pet.type) + '</span></li>' +
    '<li>Location: <span>' + escapeHtml(pet.location) + '</span></li>' +
    '</ul>' +
    '<a class="btn btn--primary" href="pet-details.html?id=' + encodeURIComponent(pet.id) + '" aria-label="View details for ' + escapeHtml(pet.name) + '">View Details</a>' +
    '</div></article>';
}

function renderPetGrid(container, pets) {
  container.innerHTML = pets.map(renderPetCard).join('');
}


function filterPets(pets, filters) {
  const query = (filters.query || '').trim().toLowerCase();
  return pets.filter(function (pet) {
    const matchesQuery = !query ||
      pet.name.toLowerCase().indexOf(query) !== -1 ||
      pet.breed.toLowerCase().indexOf(query) !== -1;
    const matchesType = !filters.type || pet.type === filters.type;
    const matchesAge = !filters.age || getAgeCategory(pet.ageMonths) === filters.age;
    const matchesLocation = !filters.location || pet.location === filters.location;
    return matchesQuery && matchesType && matchesAge && matchesLocation;
  });
}



const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isEmail(value) {
  return EMAIL_PATTERN.test(value);
}

function isEmailOrPhone(value) {
  if (isEmail(value)) return true;
  const digits = value.replace(/\D/g, '');
  return /^[+()\-.\s\d]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
}

function showFieldError(form, name, message) {
  const field = form.elements[name];
  const box = document.getElementById(name + '-error');
  if (box) { box.textContent = message; box.hidden = false; }
  if (field) { field.setAttribute('aria-invalid', 'true'); field.classList.add('has-error'); }
}

function clearFieldError(form, name) {
  const field = form.elements[name];
  const box = document.getElementById(name + '-error');
  if (box) { box.textContent = ''; box.hidden = true; }
  if (field) { field.removeAttribute('aria-invalid'); field.classList.remove('has-error'); }
}

function validateForm(form, rules) {
  let firstInvalid = null;
  const values = {};
  rules.forEach(function (rule) {
    const field = form.elements[rule.name];
    const value = field.value.trim();
    values[rule.name] = value;
    let message = '';
    if (!value) message = rule.required || '';
    else if (rule.validate) message = rule.validate(value, form) || '';
    if (message) {
      showFieldError(form, rule.name, message);
      if (!firstInvalid) firstInvalid = field;
    } else {
      clearFieldError(form, rule.name);
    }
  });
  if (firstInvalid) firstInvalid.focus();
  return { valid: !firstInvalid, values: values };
}

function clearErrorsOnInput(form, rules) {
  rules.forEach(function (rule) {
    const field = form.elements[rule.name];
    const eventName = field.tagName === 'SELECT' ? 'change' : 'input';
    field.addEventListener(eventName, function () { clearFieldError(form, rule.name); });
  });
}

function showStatus(box, type, html) {
  box.className = 'alert alert--' + type;
  box.innerHTML = html;
  box.hidden = false;
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function initHome() {
  const grid = document.getElementById('featured-grid');
  if (grid) renderPetGrid(grid, getAllPets().slice(0, 6));
}

function initAdopt() {
  const form = document.getElementById('filter-form');
  const grid = document.getElementById('pet-grid');
  const empty = document.getElementById('empty-state');
  const count = document.getElementById('results-count');
  const search = document.getElementById('search');
  const typeSelect = document.getElementById('filter-type');
  const ageSelect = document.getElementById('filter-age');
  const locationSelect = document.getElementById('filter-location');
  const clearButton = document.getElementById('clear-filters');

  const pets = getAllPets();
  const locations = Array.from(new Set(pets.map(function (p) { return p.location; }))).sort();
  fillSelect(typeSelect, PET_TYPES, 'All types');
  fillSelect(ageSelect, AGE_CATEGORIES, 'Any age');
  fillSelect(locationSelect, locations, 'All locations');

  function applyFilters() {
    const results = filterPets(pets, {
      query: search.value,
      type: typeSelect.value,
      age: ageSelect.value,
      location: locationSelect.value
    });
    renderPetGrid(grid, results);
    empty.hidden = results.length !== 0;
    grid.hidden = results.length === 0;
    count.textContent = 'Showing ' + results.length + ' of ' + pets.length + ' pets';
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); });
  search.addEventListener('input', applyFilters);
  [typeSelect, ageSelect, locationSelect].forEach(function (el) {
    el.addEventListener('change', applyFilters);
  });
  clearButton.addEventListener('click', function () {
    form.reset();
    applyFilters();
    search.focus();
  });
  document.getElementById('empty-clear').addEventListener('click', function () {
    clearButton.click();
  });

  applyFilters();
}

function initDetails() {
  const container = document.getElementById('pet-detail');
  const enquirySection = document.getElementById('enquiry');
  const id = new URLSearchParams(window.location.search).get('id');
  const pet = id ? getPetById(id) : null;

  if (!pet) {
    container.innerHTML = '<div class="empty-state"><h2>We could not find that pet</h2>' +
      '<p>The link may be old, or the listing was removed from this browser.</p>' +
      '<a class="btn btn--primary" href="adopt.html">Browse all pets</a></div>';
    enquirySection.hidden = true;
    return;
  }

  document.title = pet.name + ' | PawConnect';
  const status = pet.status || 'Available';
  const alt = pet.imageAlt || ('Photo of ' + pet.name + ', a ' + pet.breed);

  const optional = function (title, text) {
    return text ? '<h2>' + title + '</h2><p>' + escapeHtml(text) + '</p>' : '';
  };

  container.innerHTML =
    '<div class="detail__media">' +
    '<img class="pet-img" src="' + escapeHtml(pet.image || PLACEHOLDER_IMAGE) + '" alt="' + escapeHtml(alt) + '">' +
    '<span class="badge badge--status badge--' + escapeHtml(status.toLowerCase()) + '">' + escapeHtml(status) + '</span>' +
    '</div>' +
    '<div class="detail__info">' +
    '<a class="back-link" href="adopt.html">&larr; Back to all pets</a>' +
    '<h1>' + escapeHtml(pet.name) + '</h1>' +
    '<p class="detail__sub">' + escapeHtml(pet.breed) + '</p>' +
    (pet.isSample ? '<div class="notice"><strong>Sample listing.</strong> This pet is fictional and is here to demonstrate the website.</div>' : '') +
    '<dl class="facts">' +
    '<div><dt>Type</dt><dd>' + escapeHtml(pet.type) + '</dd></div>' +
    '<div><dt>Age</dt><dd>' + escapeHtml(formatAge(pet.ageMonths)) + '</dd></div>' +
    '<div><dt>Gender</dt><dd>' + escapeHtml(pet.gender || 'Not given') + '</dd></div>' +
    '<div><dt>Location</dt><dd>' + escapeHtml(pet.location) + '</dd></div>' +
    '<div><dt>Availability</dt><dd>' + escapeHtml(status) + '</dd></div>' +
    '</dl>' +
    '<h2>About ' + escapeHtml(pet.name) + '</h2><p>' + escapeHtml(pet.description) + '</p>' +
    optional('Personality', pet.personality) +
    optional('Health information', pet.health || '') +
    (!pet.health ? '<h2>Health information</h2><p>The lister has not provided health details. Ask about vaccinations and vet history before adopting.</p>' : '') +
    '<div class="btn-row">' +
    '<a class="btn btn--primary" id="contact-btn" href="#enquiry">Contact About Adoption</a>' +
    (pet.isSample ? '' : '<button class="btn btn--danger" id="remove-btn" type="button">Remove this listing</button>') +
    '</div></div>';

  document.getElementById('enqPet').value = pet.name + ' (' + pet.breed + ')';
  document.getElementById('enquiry-title').textContent = 'Ask about adopting ' + pet.name;

  document.getElementById('contact-btn').addEventListener('click', function (e) {
    e.preventDefault();
    enquirySection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(function () { document.getElementById('enqName').focus({ preventScroll: true }); }, 450);
  });

  const removeBtn = document.getElementById('remove-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', function () {
      if (!window.confirm('Remove the listing for ' + pet.name + ' from this browser?')) return;
      if (removeUserPet(pet.id)) {
        window.location.href = 'adopt.html';
      } else {
        window.alert('Sorry, the listing could not be removed. Browser storage may be blocked.');
      }
    });
  }

  const contactInfo = document.getElementById('lister-info');
  if (!pet.isSample && pet.contact) {
    contactInfo.innerHTML = '<p><strong>Listed by:</strong> ' + escapeHtml(pet.contactName || 'The lister') + '</p>' +
      '<p><strong>Contact given:</strong> ' + escapeHtml(pet.contact) + '</p>';
    contactInfo.hidden = false;
  }

  const form = document.getElementById('enquiry-form');
  const status_ = document.getElementById('enquiry-status');
  const rules = [
    { name: 'enqName', required: 'Please enter your name.', validate: function (v) { return v.length < 2 ? 'Your name needs at least 2 characters.' : ''; } },
    { name: 'enqContact', required: 'Please enter an email address or phone number.', validate: function (v) { return isEmailOrPhone(v) ? '' : 'Enter a valid email (name@example.com) or a phone number with at least 7 digits.'; } },
    { name: 'enqMessage', required: 'Please write a short message.', validate: function (v) { return v.length < 15 ? 'Please write at least 15 characters so the lister knows who you are.' : ''; } }
  ];
  clearErrorsOnInput(form, rules);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status_.hidden = true;
    const result = validateForm(form, rules);
    if (!result.valid) return;

    let html = '<h3>Demonstration only: nothing was sent</h3>' +
      '<p>Thank you, ' + escapeHtml(result.values.enqName) + '. PawConnect has no server, so your enquiry about ' +
      escapeHtml(pet.name) + ' was <strong>not delivered</strong> to anyone.</p>';
    if (!pet.isSample && isEmail(pet.contact || '')) {
      const subject = 'Adoption enquiry about ' + pet.name;
      const body = result.values.enqMessage + '\n\nFrom: ' + result.values.enqName + '\nContact: ' + result.values.enqContact;
      html += '<p>To really contact the lister, <a href="mailto:' + encodeURIComponent(pet.contact) +
        '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body) +
        '">open this message in your email app</a>.</p>';
    } else if (pet.isSample) {
      html += '<p>' + escapeHtml(pet.name) + ' is a sample pet, so there is nobody to contact.</p>';
    }
    showStatus(status_, 'success', html);
    form.reset();
    document.getElementById('enqPet').value = pet.name + ' (' + pet.breed + ')';
  });
}

function initList() {
  const form = document.getElementById('list-form');
  const statusBox = document.getElementById('list-status');
  const photoInput = document.getElementById('photo');
  const previewBox = document.getElementById('photo-preview');
  const previewImg = document.getElementById('photo-preview-img');
  const removePhotoBtn = document.getElementById('remove-photo');

  fillSelect(form.elements.petType, PET_TYPES, 'Choose a type');

  if (!isStorageAvailable()) {
    showStatus(document.getElementById('storage-warning'), 'error',
      '<h3>Saving is not available</h3><p>Your browser is blocking localStorage (private mode or strict settings), so new listings cannot be saved. The form will still check your answers, but it will not add a listing.</p>');
  }

  const rules = [
    { name: 'petName', required: "Please enter the pet's name.", validate: function (v) { return v.length < 2 || v.length > 40 ? 'The name must be 2 to 40 characters long.' : ''; } },
    { name: 'petType', required: 'Please choose an animal type.' },
    { name: 'breed', required: 'Please enter a breed (or "Mixed" if unknown).', validate: function (v) { return v.length > 60 ? 'Keep the breed under 60 characters.' : ''; } },
    { name: 'ageValue', required: "Please enter the pet's age.", validate: function (v, f) {
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) return 'Age must be a number greater than 0.';
      const months = f.elements.ageUnit.value === 'years' ? n * 12 : n;
      return months > 360 ? 'That age looks too high. Please check the number and unit.' : '';
    } },
    { name: 'gender', required: 'Please choose a gender.' },
    { name: 'location', required: 'Please enter where the pet is (city or area).', validate: function (v) { return v.length > 60 ? 'Keep the location under 60 characters.' : ''; } },
    { name: 'description', required: 'Please describe the pet.', validate: function (v) { return v.length < 30 ? 'Please write at least 30 characters (' + v.length + ' so far).' : v.length > 800 ? 'Please keep the description under 800 characters.' : ''; } },
    { name: 'personality', validate: function (v) { return v.length > 200 ? 'Keep personality notes under 200 characters.' : ''; } },
    { name: 'health', validate: function (v) { return v.length > 400 ? 'Keep health information under 400 characters.' : ''; } },
    { name: 'contactName', required: 'Please enter a contact name.', validate: function (v) { return v.length < 2 ? 'The contact name needs at least 2 characters.' : ''; } },
    { name: 'contact', required: 'Please enter an email address or phone number.', validate: function (v) { return isEmailOrPhone(v) ? '' : 'Enter a valid email (name@example.com) or a phone number with at least 7 digits.'; } }
  ];
  clearErrorsOnInput(form, rules);

  let photoPromise = null;
  let photoFailed = false;

  function resetPhoto() {
    photoInput.value = '';
    photoPromise = null;
    photoFailed = false;
    previewImg.removeAttribute('src');
    previewBox.hidden = true;
    clearFieldError(form, 'photo');
  }

  photoInput.addEventListener('change', function () {
    const file = photoInput.files[0];
    photoPromise = null;
    photoFailed = false;
    clearFieldError(form, 'photo');
    if (!file) { resetPhoto(); return; }

    if (file.type.indexOf('image/') !== 0) {
      resetPhoto();
      showFieldError(form, 'photo', 'That file is not an image. Please choose a JPG, PNG or WebP photo.');
      photoFailed = true;
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      resetPhoto();
      showFieldError(form, 'photo', 'That photo is larger than 8 MB. Please choose a smaller one.');
      photoFailed = true;
      return;
    }

    const thisPromise = resizeImage(file, 800, 0.8);
    photoPromise = thisPromise;
    thisPromise.then(function (dataUrl) {
      if (photoPromise !== thisPromise) return; 
      previewImg.src = dataUrl;
      previewBox.hidden = false;
    }).catch(function () {
      if (photoPromise !== thisPromise) return;
      resetPhoto();
      photoFailed = true;
      showFieldError(form, 'photo', 'We could not read that image. Please try a different photo.');
    });
  });
  removePhotoBtn.addEventListener('click', function () {
    resetPhoto();
    photoInput.focus();
  });

  form.addEventListener('reset', function () {
    rules.forEach(function (rule) { clearFieldError(form, rule.name); });
    resetPhoto();
    statusBox.hidden = true;
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    statusBox.hidden = true;

    const result = validateForm(form, rules);
    if (!result.valid) {
      showStatus(statusBox, 'error', '<h3>Please fix the highlighted fields</h3><p>Some answers are missing or need a change before we can save the listing.</p>');
      return;
    }
    if (photoFailed) {
      photoInput.focus();
      showStatus(statusBox, 'error', '<h3>Check the photo</h3><p>Please choose a valid image, or remove it to continue without a photo.</p>');
      return;
    }

    let image = '';
    if (photoPromise) {
      try { image = await photoPromise; }
      catch (err) {
        showFieldError(form, 'photo', 'We could not read that image. Please try a different photo.');
        photoInput.focus();
        return;
      }
    }

    const v = result.values;
    const amount = Number(v.ageValue);
    const pet = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      name: v.petName,
      type: v.petType,
      breed: v.breed,
      ageMonths: Math.max(1, Math.round(form.elements.ageUnit.value === 'years' ? amount * 12 : amount)),
      gender: v.gender,
      location: v.location,
      description: v.description,
      personality: v.personality,
      health: v.health,
      image: image,
      imageAlt: 'Photo of ' + v.petName + ', a ' + v.breed,
      status: 'Available',
      contactName: v.contactName,
      contact: v.contact,
      isSample: false
    };

    const pets = loadUserPets();
    pets.unshift(pet);
    const saved = saveUserPets(pets);
    const confirmed = saved && loadUserPets().some(function (p) { return p.id === pet.id; });

    if (!confirmed) {
      showStatus(statusBox, 'error',
        '<h3>The listing was not saved</h3><p>Your browser could not store it. Storage may be full or blocked' +
        (image ? ', and the photo may be too large. Try removing the photo or a few old listings' : '') +
        '. Nothing was added to the gallery.</p>');
      return;
    }

    form.reset();
    showStatus(statusBox, 'success',
      '<h3>' + escapeHtml(pet.name) + ' is now listed</h3>' +
      '<p>Your listing was saved in this browser and added to the gallery. Because PawConnect uses localStorage, only this browser can see it.</p>' +
      '<p><a href="pet-details.html?id=' + encodeURIComponent(pet.id) + '">View the listing</a> &middot; <a href="adopt.html">See the gallery</a></p>');
  });
}

function initContact() {
  const form = document.getElementById('contact-form');
  const statusBox = document.getElementById('contact-status');
  const rules = [
    { name: 'cName', required: 'Please enter your name.', validate: function (v) { return v.length < 2 ? 'Your name needs at least 2 characters.' : ''; } },
    { name: 'cEmail', required: 'Please enter your email address.', validate: function (v) { return isEmail(v) ? '' : 'Enter a valid email address, like name@example.com.'; } },
    { name: 'cSubject', required: 'Please enter a subject.' },
    { name: 'cMessage', required: 'Please write a message.', validate: function (v) { return v.length < 15 ? 'Please write at least 15 characters.' : ''; } }
  ];
  clearErrorsOnInput(form, rules);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusBox.hidden = true;
    const result = validateForm(form, rules);
    if (!result.valid) return;
    showStatus(statusBox, 'success',
      '<h3>Demonstration only: nothing was sent</h3><p>Thanks, ' + escapeHtml(result.values.cName) +
      '. This website has no server, so your message was <strong>not</strong> delivered to anyone. In a real version, this is where it would be sent.</p>');
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', function () {
  renderLayout();
  setupNav();
  const views = { home: initHome, adopt: initAdopt, details: initDetails, list: initList, contact: initContact };
  const start = views[document.body.dataset.view];
  if (start) start();
});
