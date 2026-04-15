$(function () {
  const storageKey = 'cv-builder-data';
  const photoPreview = $('#photoPreview');
  const form = $('#cvForm');
  const skillItems = [];
  const languageItems = [];
  let skillEditIndex = null;
  let languageEditIndex = null;

  const skillEditor = {
    name: $('#skillName'),
    level: $('#skillLevel'),
    error: $('#skillFormError'),
    save: $('#saveSkill'),
  };

  const languageEditor = {
    name: $('#languageName'),
    level: $('#languageLevel'),
    error: $('#languageFormError'),
    save: $('#saveLanguage'),
  };

  function getFieldMessage(fieldName) {
    const messages = {
      fullName: 'El nombre completo es obligatorio.',
      jobTitle: 'El titulo profesional es obligatorio.',
      summary: 'El perfil profesional es obligatorio.',
      email: 'Introduce un correo electronico valido.',
      phone: 'El telefono es obligatorio y solo puede contener numeros.',
      location: 'La ciudad es obligatoria.',
      website: 'Introduce una web valida que empiece por https://.',
      linkedin: 'Introduce un enlace valido que empiece por https://.',
      github: 'Introduce un enlace valido que empiece por https://.',
    };

    return messages[fieldName] || 'Este campo es obligatorio.';
  }

  function setFieldState($field, message) {
    const isValid = !message;
    $field.toggleClass('is-valid', isValid);
    $field.toggleClass('is-invalid', !isValid);
    $field[0].setCustomValidity(message || '');
    return isValid;
  }

  function validateRequiredField(selector) {
    const $field = $(selector);
    const value = $field.val().trim();
    const fieldName = $field.attr('id') || $field.attr('name');

    if (!value) {
      return setFieldState($field, getFieldMessage(fieldName));
    }

    return setFieldState($field, '');
  }

  function validateEmailField() {
    const $field = $('#email');
    const value = $field.val().trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return setFieldState($field, value && isValid ? '' : getFieldMessage('email'));
  }

  function validatePhoneField() {
    const $field = $('#phone');
    const digitsOnly = $field.val().replace(/\D/g, '');
    if ($field.val() !== digitsOnly) {
      $field.val(digitsOnly);
    }

    const isValid = /^\d{7,}$/.test(digitsOnly);
    return setFieldState($field, digitsOnly && isValid ? '' : getFieldMessage('phone'));
  }

  function validateWebsiteField() {
    const $field = $('#website');
    const value = $field.val().trim();

    if (!value) {
      return setFieldState($field, '');
    }

    try {
      const url = new URL(value);
      const isValid = url.protocol === 'https:';
      return setFieldState($field, isValid ? '' : getFieldMessage('website'));
    } catch (error) {
      return setFieldState($field, getFieldMessage('website'));
    }
  }

  function validateHttpsField(selector, fieldName) {
    const $field = $(selector);
    const value = $field.val().trim();

    if (!value) {
      return setFieldState($field, '');
    }

    try {
      const url = new URL(value);
      const isValid = url.protocol === 'https:';
      return setFieldState($field, isValid ? '' : getFieldMessage(fieldName));
    } catch (error) {
      return setFieldState($field, getFieldMessage(fieldName));
    }
  }

  function validateCoreForm() {
    const validators = [
      () => validateRequiredField('#fullName'),
      () => validateRequiredField('#jobTitle'),
      () => validateRequiredField('#summary'),
      () => validateEmailField(),
      () => validatePhoneField(),
      () => validateRequiredField('#location'),
      () => validateWebsiteField(),
      () => validateHttpsField('#linkedin', 'linkedin'),
      () => validateHttpsField('#github', 'github'),
    ];

    return validators.every((validator) => validator());
  }

  function createCrudManager(config) {
    const state = {
      items: [],
      editIndex: null,
    };

    const editorFields = Object.entries(config.fields).reduce((accumulator, [key, fieldConfig]) => {
      accumulator[key] = $(fieldConfig.selector);
      return accumulator;
    }, {});

    const editorError = $(config.errorSelector);
    const saveButton = $(config.saveSelector);
    const tableBody = $(config.tableBodySelector);
    const addButton = config.addSelector ? $(config.addSelector) : null;

    function clearEditor() {
      Object.values(editorFields).forEach(($field) => {
        $field.val('');
        $field.removeClass('is-valid is-invalid');
        if ($field[0] && $field[0].setCustomValidity) {
          $field[0].setCustomValidity('');
        }
      });
      editorError.addClass('d-none');
      saveButton.text('Guardar');
      state.editIndex = null;
    }

    function validateEditor() {
      const values = {};
      let isValid = true;

      Object.entries(config.fields).forEach(([key, fieldConfig]) => {
        const value = editorFields[key].val().trim();
        values[key] = value;

        if (fieldConfig.required && !value) {
          isValid = false;
        }
      });

      editorError.toggleClass('d-none', isValid);
      return isValid ? values : null;
    }

    function render() {
      if (!state.items.length) {
        tableBody.html(`<tr class="empty-row"><td colspan="${config.columns}"><span class="empty-state compact-empty-row">Todavia no has guardado ${config.emptyLabel}.</span></td></tr>`);
        return;
      }

      tableBody.html(state.items.map((item, index) => config.renderRow(item, index)).join(''));
    }

    function save() {
      const values = validateEditor();
      if (!values) {
        return;
      }

      if (state.editIndex === null) {
        state.items.push(values);
      } else {
        state.items[state.editIndex] = values;
      }

      render();
      clearEditor();
    }

    function edit(index) {
      const item = state.items[index];
      if (!item) {
        return;
      }

      Object.entries(editorFields).forEach(([key, $field]) => {
        $field.val(item[key] || '');
      });

      state.editIndex = index;
      editorError.addClass('d-none');
      saveButton.text('Actualizar');
      saveButton.text('Actualizar');
    }

    function remove(index) {
      state.items.splice(index, 1);
      if (state.editIndex === index) {
        clearEditor();
      } else if (state.editIndex !== null && state.editIndex > index) {
        state.editIndex -= 1;
      }
      render();
    }

    if (addButton && addButton.length) {
      addButton.on('click', function () {
        clearEditor();
        editorFields[config.focusField].focus();
      });
    }

    saveButton.on('click', save);
    tableBody.on('click', '[data-action="edit"]', function () {
      edit(Number($(this).data('index')));
    });
    tableBody.on('click', '[data-action="delete"]', function () {
      remove(Number($(this).data('index')));
    });

    render();

    return {
      state,
      clearEditor,
      render,
    };
  }

  const experienceManager = createCrudManager({
    saveSelector: '#saveExperience',
    tableBodySelector: '#experienceTableBody',
    errorSelector: '#experienceFormError',
    emptyLabel: 'experiencia',
    columns: 4,
    focusField: 'company',
    fields: {
      company: { selector: '#experienceCompany', required: true },
      role: { selector: '#experienceRole', required: true },
      period: { selector: '#experiencePeriod', required: true },
      location: { selector: '#experienceLocation', required: false },
      achievements: { selector: '#experienceAchievements', required: true },
    },
    renderRow(item, index) {
      return `
        <tr>
          <td>
            <div class="compact-cell-title">${escapeHtml(item.role || '')}</div>
            <div class="compact-cell-subtitle">${escapeHtml(item.company || '')}${item.location ? ` · ${escapeHtml(item.location)}` : ''}</div>
          </td>
          <td>${escapeHtml(item.period || '')}</td>
          <td><span class="compact-summary">${escapeHtml(item.achievements || '')}</span></td>
          <td class="text-end">
            <div class="table-actions">
              <button type="button" class="btn btn-sm btn-ghost table-action-btn" data-action="edit" data-index="${index}">Editar</button>
              <button type="button" class="btn btn-sm btn-ghost table-action-btn" data-action="delete" data-index="${index}">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    },
  });

  const educationManager = createCrudManager({
    saveSelector: '#saveEducation',
    tableBodySelector: '#educationTableBody',
    errorSelector: '#educationFormError',
    emptyLabel: 'educacion',
    columns: 4,
    focusField: 'institution',
    fields: {
      institution: { selector: '#educationInstitution', required: true },
      degree: { selector: '#educationDegree', required: true },
      period: { selector: '#educationPeriod', required: true },
      details: { selector: '#educationDetails', required: false },
    },
    renderRow(item, index) {
      return `
        <tr>
          <td>
            <div class="compact-cell-title">${escapeHtml(item.degree || '')}</div>
            <div class="compact-cell-subtitle">${escapeHtml(item.institution || '')}</div>
          </td>
          <td>${escapeHtml(item.period || '')}</td>
          <td><span class="compact-summary">${escapeHtml(item.details || '')}</span></td>
          <td class="text-end">
            <div class="table-actions">
              <button type="button" class="btn btn-sm btn-ghost table-action-btn" data-action="edit" data-index="${index}">Editar</button>
              <button type="button" class="btn btn-sm btn-ghost table-action-btn" data-action="delete" data-index="${index}">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    },
  });

  const projectManager = createCrudManager({
    saveSelector: '#saveProject',
    tableBodySelector: '#projectTableBody',
    errorSelector: '#projectFormError',
    emptyLabel: 'proyecto',
    columns: 4,
    focusField: 'name',
    fields: {
      name: { selector: '#projectName', required: true },
      tech: { selector: '#projectTech', required: true },
      description: { selector: '#projectDescription', required: true },
      link: { selector: '#projectLink', required: false },
    },
    renderRow(item, index) {
      const techChips = (item.tech || '')
        .split(',')
        .map((tech) => tech.trim())
        .filter(Boolean)
        .slice(0, 3)
        .map((tech) => `<span class="tech-chip">${escapeHtml(tech)}</span>`)
        .join(' ');

      return `
        <tr>
          <td>
            <div class="compact-cell-title">${escapeHtml(item.name || '')}</div>
            <div class="compact-cell-subtitle">${item.link ? `<a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.link)}</a>` : ''}</div>
          </td>
          <td><div class="tech-chip-group">${techChips}</div></td>
          <td><span class="compact-summary">${escapeHtml(item.description || '')}</span></td>
          <td class="text-end">
            <div class="table-actions">
              <button type="button" class="btn btn-sm btn-ghost table-action-btn" data-action="edit" data-index="${index}">Editar</button>
              <button type="button" class="btn btn-sm btn-ghost table-action-btn" data-action="delete" data-index="${index}">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    },
  });

  const certificationManager = createCrudManager({
    saveSelector: '#saveCertification',
    tableBodySelector: '#certificationTableBody',
    errorSelector: '#certificationFormError',
    emptyLabel: 'certificacion',
    columns: 4,
    focusField: 'name',
    fields: {
      name: { selector: '#certificationName', required: true },
      issuer: { selector: '#certificationIssuer', required: true },
      date: { selector: '#certificationDate', required: true },
      details: { selector: '#certificationDetails', required: false },
    },
    renderRow(item, index) {
      return `
        <tr>
          <td>
            <div class="compact-cell-title">${escapeHtml(item.name || '')}</div>
            <div class="compact-cell-subtitle">${escapeHtml(item.details || '')}</div>
          </td>
          <td>${escapeHtml(item.issuer || '')}</td>
          <td>${escapeHtml(item.date || '')}</td>
          <td class="text-end">
            <div class="table-actions">
              <button type="button" class="btn btn-sm btn-ghost table-action-btn" data-action="edit" data-index="${index}">Editar</button>
              <button type="button" class="btn btn-sm btn-ghost table-action-btn" data-action="delete" data-index="${index}">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    },
  });

  const referenceManager = createCrudManager({
    saveSelector: '#saveReference',
    tableBodySelector: '#referenceTableBody',
    errorSelector: '#referenceFormError',
    emptyLabel: 'referencia',
    columns: 4,
    focusField: 'name',
    fields: {
      name: { selector: '#referenceName', required: true },
      role: { selector: '#referenceRole', required: true },
      contact: { selector: '#referenceContact', required: true },
      company: { selector: '#referenceCompany', required: false },
    },
    renderRow(item, index) {
      return `
        <tr>
          <td>
            <div class="compact-cell-title">${escapeHtml(item.name || '')}</div>
            <div class="compact-cell-subtitle">${escapeHtml(item.role || '')}</div>
          </td>
          <td>${escapeHtml(item.contact || '')}</td>
          <td><span class="compact-summary">${escapeHtml(item.company || '')}</span></td>
          <td class="text-end">
            <div class="table-actions">
              <button type="button" class="btn btn-sm btn-ghost table-action-btn" data-action="edit" data-index="${index}">Editar</button>
              <button type="button" class="btn btn-sm btn-ghost table-action-btn" data-action="delete" data-index="${index}">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    },
  });

  function escapeHtml(value) {
    return $('<div>').text(value || '').html();
  }

  function setEditorError($error, visible) {
    $error.toggleClass('d-none', !visible);
  }

  function clearCompetencyEditor(type) {
    const editor = type === 'skill' ? skillEditor : languageEditor;
    editor.name.val('');
    editor.level.val('');
    editor.save.text('Guardar');
    setEditorError(editor.error, false);
    if (type === 'skill') {
      skillEditIndex = null;
    } else {
      languageEditIndex = null;
    }
  }

  function validateCompetencyEditor(type) {
    const editor = type === 'skill' ? skillEditor : languageEditor;
    const name = editor.name.val().trim();
    const level = editor.level.val().trim();

    if (!name || !level) {
      setEditorError(editor.error, true);
      return null;
    }

    setEditorError(editor.error, false);
    return { name, level };
  }

  function renderCompetencyTable(type) {
    const items = type === 'skill' ? skillItems : languageItems;
    const $tbody = type === 'skill' ? $('#skillTableBody') : $('#languageTableBody');

    if (!items.length) {
      $tbody.html(`<tr class="empty-row"><td colspan="3"><span class="empty-state compact-empty-row">Todavia no has guardado ${type === 'skill' ? 'habilidades' : 'idiomas'}.</span></td></tr>`);
      return;
    }

    const rows = items.map((item, index) => `
      <tr>
        <td>
          <div class="compact-cell-title">${escapeHtml(item.name)}</div>
        </td>
        <td>
          <span class="level-chip level-${escapeHtml(item.level).toLowerCase()}">${escapeHtml(item.level)}</span>
        </td>
        <td class="text-end">
          <div class="table-actions">
            <button type="button" class="btn btn-sm btn-ghost table-action-btn" data-action="edit" data-type="${type}" data-index="${index}">Editar</button>
            <button type="button" class="btn btn-sm btn-ghost table-action-btn" data-action="delete" data-type="${type}" data-index="${index}">Eliminar</button>
          </div>
        </td>
      </tr>
    `).join('');

    $tbody.html(rows);
  }

  function saveCompetency(type) {
    const editor = type === 'skill' ? skillEditor : languageEditor;
    const validated = validateCompetencyEditor(type);

    if (!validated) {
      return;
    }

    const items = type === 'skill' ? skillItems : languageItems;
    const editIndex = type === 'skill' ? skillEditIndex : languageEditIndex;

    if (editIndex === null) {
      items.push(validated);
    } else {
      items[editIndex] = validated;
    }

    renderCompetencyTable(type);
    clearCompetencyEditor(type);
    editor.name.focus();
  }

  function editCompetency(type, index) {
    const items = type === 'skill' ? skillItems : languageItems;
    const editor = type === 'skill' ? skillEditor : languageEditor;
    const item = items[index];

    if (!item) {
      return;
    }

    editor.name.val(item.name);
    editor.level.val(item.level);
    editor.save.text('Actualizar');
    setEditorError(editor.error, false);

    if (type === 'skill') {
      skillEditIndex = index;
    } else {
      languageEditIndex = index;
    }

    editor.name.focus();
  }

  function deleteCompetency(type, index) {
    const items = type === 'skill' ? skillItems : languageItems;
    items.splice(index, 1);
    renderCompetencyTable(type);

    if (type === 'skill') {
      if (skillEditIndex === index) {
        clearCompetencyEditor(type);
      } else if (skillEditIndex !== null && skillEditIndex > index) {
        skillEditIndex -= 1;
      }
    } else {
      if (languageEditIndex === index) {
        clearCompetencyEditor(type);
      } else if (languageEditIndex !== null && languageEditIndex > index) {
        languageEditIndex -= 1;
      }
    }
  }

  function setPhotoPreview(src) {
    if (src) {
      photoPreview.html(`<img src="${src}" alt="Foto de perfil">`);
      photoPreview.addClass('has-image');
      photoPreview.data('photo-src', src);
      return;
    }

    photoPreview.html('<span>CV</span>');
    photoPreview.removeClass('has-image');
    photoPreview.removeData('photo-src');
  }

  function createItem(templateId, listId) {
    const template = document.getElementById(templateId);
    const clone = template.content.cloneNode(true);
    const item = clone.querySelector('.item-card');

    $(item).on('click', '.btn-remove', function () {
      item.remove();
    });

    $('#' + listId).append(clone);
  }

  function ensureInitialItems() {
    renderCompetencyTable('skill');
    renderCompetencyTable('language');
    experienceManager.render();
    educationManager.render();
    projectManager.render();
    certificationManager.render();
    referenceManager.render();
  }

  function splitItems(value) {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  function readExperience() {
    return experienceManager.state.items.slice();
  }

  function readEducation() {
    return educationManager.state.items.slice();
  }

  function readProjects() {
    return projectManager.state.items.slice();
  }

  function readSkills() {
    return skillItems.slice();
  }

  function readLanguages() {
    return languageItems.slice();
  }

  function readCertifications() {
    return certificationManager.state.items.slice();
  }

  function readReferences() {
    return referenceManager.state.items.slice();
  }

  function collectData() {
    return {
      fullName: $('#fullName').val().trim(),
      jobTitle: $('#jobTitle').val().trim(),
      summary: $('#summary').val().trim(),
      email: $('#email').val().trim(),
      phone: $('#phone').val().trim(),
      location: $('#location').val().trim(),
      website: $('#website').val().trim(),
      linkedin: $('#linkedin').val().trim(),
      github: $('#github').val().trim(),
      skills: readSkills(),
      languages: readLanguages(),
      experience: readExperience(),
      education: readEducation(),
      projects: readProjects(),
      certifications: readCertifications(),
      references: readReferences(),
      photo: photoPreview.data('photo-src') || '',
    };
  }

  function clearValidationState() {
    form.find('.is-valid, .is-invalid').removeClass('is-valid is-invalid');
    form.find('input, textarea, select').each(function () {
      if (this.setCustomValidity) {
        this.setCustomValidity('');
      }
    });
  }

  function fillDemoData() {
    $('#fullName').val('Andrea López');
    $('#jobTitle').val('Product Designer');
    $('#summary').val('Diseñadora de producto centrada en la experiencia de usuario, prototipado y diseño visual para productos digitales.');
    $('#email').val('andrea.lopez@demo.com');
    $('#phone').val('600123456');
    $('#location').val('Madrid, España');
    $('#website').val('https://andrealopez.dev');
    $('#linkedin').val('https://linkedin.com/in/andrealopez');
    $('#github').val('https://github.com/andrealopez');

    skillItems.splice(0, skillItems.length, ...[
      { name: 'Figma', level: 'Alto' },
      { name: 'UX Research', level: 'Alto' },
      { name: 'HTML y CSS', level: 'Medio' },
    ]);

    languageItems.splice(0, languageItems.length, ...[
      { name: 'Inglés', level: 'Alto' },
      { name: 'Francés', level: 'Medio' },
    ]);

    experienceManager.state.items.splice(0, experienceManager.state.items.length, ...[
      {
        company: 'Studio North',
        role: 'Product Designer',
        period: '2022 - Actualidad',
        location: 'Remoto',
        achievements: 'Rediseño de flujos clave, mejora de la conversión y prototipado de nuevas funcionalidades.',
      },
      {
        company: 'Pixel Forge',
        role: 'UI Designer',
        period: '2020 - 2022',
        location: 'Madrid',
        achievements: 'Sistema visual para productos SaaS y librerías de componentes consistentes.',
      },
    ]);

    educationManager.state.items.splice(0, educationManager.state.items.length, ...[
      {
        institution: 'Universidad Politécnica de Madrid',
        degree: 'Grado en Diseño',
        period: '2016 - 2020',
        details: 'Especialización en productos digitales',
      },
    ]);

    projectManager.state.items.splice(0, projectManager.state.items.length, ...[
      {
        name: 'Dashboard Analytics',
        tech: 'Figma, HTML, CSS, Bootstrap',
        description: 'Interfaz de analítica con jerarquía clara, accesible y preparada para uso comercial.',
        link: 'https://example.com/dashboard',
      },
      {
        name: 'App de Reservas',
        tech: 'UX, Prototipado, Research',
        description: 'Reducción de pasos en el flujo de reserva y mejoras en la experiencia en móvil.',
        link: 'https://example.com/reservas',
      },
    ]);

    certificationManager.state.items.splice(0, certificationManager.state.items.length, ...[
      {
        name: 'Google UX Design',
        issuer: 'Google',
        date: '2024',
        details: 'Certificación profesional en UX',
      },
    ]);

    referenceManager.state.items.splice(0, referenceManager.state.items.length, ...[
      {
        name: 'Laura Gómez',
        role: 'Head of Product',
        contact: 'laura.gomez@demo.com',
        company: 'Studio North',
      },
    ]);

    clearValidationState();
    setPhotoPreview('');
    $('#profilePhoto').val('');

    renderCompetencyTable('skill');
    renderCompetencyTable('language');
    experienceManager.render();
    educationManager.render();
    projectManager.render();
    certificationManager.render();
    referenceManager.render();

    skillEditor.name.focus();
  }

  function hasRequiredText(value) {
    return value && value.trim().length > 0;
  }

  $('#saveSkill').on('click', function () {
    saveCompetency('skill');
  });

  $('#saveLanguage').on('click', function () {
    saveCompetency('language');
  });

  $('#skillTableBody').on('click', '[data-action="edit"]', function () {
    editCompetency($(this).data('type'), Number($(this).data('index')));
  });

  $('#languageTableBody').on('click', '[data-action="edit"]', function () {
    editCompetency($(this).data('type'), Number($(this).data('index')));
  });

  $('#skillTableBody').on('click', '[data-action="delete"]', function () {
    deleteCompetency($(this).data('type'), Number($(this).data('index')));
  });

  $('#languageTableBody').on('click', '[data-action="delete"]', function () {
    deleteCompetency($(this).data('type'), Number($(this).data('index')));
  });

  $('#profilePhoto').on('change', function () {
    const file = this.files && this.files[0];

    if (!file) {
      setPhotoPreview('');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      setPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  });

  $('#fillDemoData').on('click', function () {
    fillDemoData();
  });

  $('#fullName, #jobTitle, #summary, #email, #phone, #location, #website, #linkedin, #github').on('input blur', function () {
    const fieldId = $(this).attr('id');

    if (fieldId === 'email') {
      validateEmailField();
      return;
    }

    if (fieldId === 'phone') {
      validatePhoneField();
      return;
    }

    if (fieldId === 'website') {
      validateWebsiteField();
      return;
    }

    if (fieldId === 'linkedin' || fieldId === 'github') {
      validateHttpsField(`#${fieldId}`, fieldId);
      return;
    }

    validateRequiredField(this);
  });

  $('#cvForm').on('submit', function (event) {
    event.preventDefault();

    const coreValid = validateCoreForm();
    if (!coreValid) {
      const firstInvalid = form.find('.is-invalid').get(0);
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    if (!skillItems.length) {
      setEditorError(skillEditor.error, true);
      skillEditor.name.focus();
      return;
    }

    if (!languageItems.length) {
      setEditorError(languageEditor.error, true);
      languageEditor.name.focus();
      return;
    }

    if (!form[0].reportValidity()) {
      return;
    }

    const data = collectData();
    const requiredFields = [
      data.fullName,
      data.jobTitle,
      data.summary,
      data.email,
      data.phone,
      data.location,
    ];

    if (!requiredFields.every(hasRequiredText)) {
      alert('Completa los datos basicos antes de generar el CV.');
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(data));
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      // Ignore storage failures in file:// or restricted contexts.
    }
    window.name = `cv-builder-data:${JSON.stringify(data)}`;
    window.location.href = 'cv.html';
  });

  $('#cvForm').on('reset', function () {
    window.setTimeout(function () {
      form.find('.is-valid, .is-invalid').removeClass('is-valid is-invalid');
      form.find('input, textarea, select').each(function () {
        if (this.setCustomValidity) {
          this.setCustomValidity('');
        }
      });
      skillItems.length = 0;
      languageItems.length = 0;
      experienceManager.state.items.length = 0;
      educationManager.state.items.length = 0;
      projectManager.state.items.length = 0;
      certificationManager.state.items.length = 0;
      referenceManager.state.items.length = 0;
      experienceManager.clearEditor();
      educationManager.clearEditor();
      projectManager.clearEditor();
      certificationManager.clearEditor();
      referenceManager.clearEditor();
      renderCompetencyTable('skill');
      renderCompetencyTable('language');
      $('#profilePhoto').val('');
      setPhotoPreview('');
      ensureInitialItems();
    }, 0);
  });

  renderCompetencyTable('skill');
  renderCompetencyTable('language');
  ensureInitialItems();
});