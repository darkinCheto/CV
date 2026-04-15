$(function () {
  const storageKey = 'cv-builder-data';
  const namePrefix = 'cv-builder-data:';
  let rawData = '';

  if (window.name && window.name.startsWith(namePrefix)) {
    rawData = window.name.slice(namePrefix.length);
    window.name = '';
  }

  if (!rawData) {
    try {
      rawData = sessionStorage.getItem(storageKey) || '';
    } catch (error) {
      rawData = '';
    }
  }

  if (!rawData) {
    try {
      rawData = localStorage.getItem(storageKey) || '';
    } catch (error) {
      rawData = '';
    }
  }

  if (!rawData) {
    $('#cvPaper').html('<div class="empty-state">No hay datos guardados. Vuelve al formulario para crear tu CV.</div>');
    $('#downloadPdf').prop('disabled', true);
    return;
  }

  const data = JSON.parse(rawData);

  function initialsFromName(name) {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  function escapeText(value) {
    return $('<div>').text(value || '').html();
  }

  function joinList(values, fallback) {
    if (Array.isArray(values)) {
      return values.filter(Boolean);
    }

    if (typeof values === 'string') {
      const normalized = values
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

      return normalized.length ? normalized : [fallback];
    }

    return [fallback];
  }

  function renderCompactItem(title, body) {
    if (!title && !body) {
      return '';
    }

    return `
      <div class="compact-item">
        <strong>${escapeText(title)}</strong>
        <span>${escapeText(body)}</span>
      </div>
    `;
  }

  function renderLanguage(item) {
    return item.name || item.level ? `<span class="pill">${escapeText(item.name)} · ${escapeText(item.level)}</span>` : '';
  }

  function renderCompetency(item) {
    return item.name || item.level ? renderCompactItem(item.name, item.level) : '';
  }

  function renderCertification(item) {
    const title = [item.name, item.date ? `(${item.date})` : ''].filter(Boolean).join(' ');
    const body = [item.issuer, item.details].filter(Boolean).join(' · ');
    return renderCompactItem(title, body);
  }

  function renderReference(item) {
    const title = item.name || 'Referencia';
    const body = [item.role, item.company, item.contact].filter(Boolean).join(' · ');
    return renderCompactItem(title, body);
  }

  function renderContactItem(label, value, isLink) {
    if (!value) {
      return '';
    }

    const iconMap = {
      Email: 'bi-envelope-fill',
      Telefono: 'bi-telephone-fill',
      Ubicacion: 'bi-geo-alt-fill',
      Web: 'bi-link-45deg',
      LinkedIn: 'bi-linkedin',
      GitHub: 'bi-github',
    };

    const display = escapeText(value);
    const content = isLink ? `<a href="${display}" target="_blank" rel="noopener noreferrer">${display}</a>` : display;
    const iconClass = iconMap[label] || 'bi-dot';
    return `<li><span class="contact-label"><i class="bi ${iconClass} contact-icon"></i>${escapeText(label)}</span>${content}</li>`;
  }

  function renderExperience(item) {
    return `
      <article class="timeline-item">
        <div class="timeline-item-inner">
          <div class="timeline-meta">
            <span>${escapeText(item.period)}</span>
            ${item.location ? `<span>${escapeText(item.location)}</span>` : ''}
          </div>
          <div class="timeline-role">${escapeText(item.role)} · ${escapeText(item.company)}</div>
          <p class="timeline-desc">${escapeText(item.achievements)}</p>
        </div>
      </article>
    `;
  }

  function renderEducation(item) {
    return `
      <article class="timeline-item">
        <div class="timeline-item-inner">
          <div class="timeline-meta">
            <span>${escapeText(item.period)}</span>
          </div>
          <div class="timeline-role">${escapeText(item.degree)}</div>
          <p class="timeline-desc"><strong>${escapeText(item.institution)}</strong>${item.details ? ` · ${escapeText(item.details)}` : ''}</p>
        </div>
      </article>
    `;
  }

  function renderProject(item) {
    const chips = joinList(item.tech, 'HTML').map((tech) => `<span class="tech-chip">${escapeText(tech)}</span>`).join('');

    return `
      <article class="project-card">
        <div class="project-title">${escapeText(item.name)}</div>
        <p class="project-desc">${escapeText(item.description)}</p>
        <div class="project-tech">${chips}</div>
        ${item.link ? `<a class="link-text" href="${escapeText(item.link)}" target="_blank" rel="noopener noreferrer">${escapeText(item.link)}</a>` : ''}
      </article>
    `;
  }

  function isCanvasBlank(canvas) {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const samplesX = 8;
    const samplesY = 8;
    const stepX = Math.max(1, Math.floor(canvas.width / samplesX));
    const stepY = Math.max(1, Math.floor(canvas.height / samplesY));

    for (let y = 0; y < canvas.height; y += stepY) {
      for (let x = 0; x < canvas.width; x += stepX) {
        const pixel = context.getImageData(Math.min(x, canvas.width - 1), Math.min(y, canvas.height - 1), 1, 1).data;
        const isWhite = pixel[0] > 245 && pixel[1] > 245 && pixel[2] > 245 && pixel[3] > 240;

        if (!isWhite) {
          return false;
        }
      }
    }

    return true;
  }

  async function generateFallbackPdf() {
    const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const pagePaddingTop = 14;
    const headerHeight = 58;
    const sectionGap = 4;
    const sectionWidth = pageWidth - (margin * 2);

    let cursorY = pagePaddingTop;

    function getImageFormat(dataUrl) {
      if (typeof dataUrl !== 'string') {
        return 'PNG';
      }

      if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
        return 'JPEG';
      }

      return 'PNG';
    }

    function splitLines(text, width) {
      return pdf.splitTextToSize(String(text || ''), width).filter(Boolean);
    }

    function getContactItems(compact) {
      return [
        { type: 'email', value: data.email, text: data.email },
        { type: 'phone', value: data.phone, text: data.phone },
        { type: 'location', value: data.location, text: data.location },
        { type: 'web', value: compact ? null : data.website, text: data.website },
        { type: 'linkedin', value: compact ? null : data.linkedin, text: data.linkedin },
        { type: 'github', value: compact ? null : data.github, text: data.github },
      ].filter((item) => item.value);
    }

    function svgToDataUrl(svg) {
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    function rasterizeSvg(svg) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        image.onerror = reject;
        image.src = svgToDataUrl(svg);
      });
    }

    const iconSvgMap = {
      email: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1.5" y="3" width="13" height="10" rx="2"></rect>
          <path d="M2.5 4.5 8 8.8 13.5 4.5"></path>
        </svg>
      `,
      phone: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4.2" y="2.2" width="7.6" height="11.6" rx="1.8"></rect>
          <path d="M6.1 4.6h3.8"></path>
          <circle cx="8" cy="11.8" r="0.6" fill="#ffffff" stroke="none"></circle>
        </svg>
      `,
      location: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#ffffff" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 14.4s4-4.3 4-7.3a4 4 0 1 0-8 0c0 3 4 7.3 4 7.3z"></path>
          <circle cx="8" cy="7" r="1.6"></circle>
        </svg>
      `,
      web: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="8" cy="8" r="5.8"></circle>
          <path d="M2.8 8h10.4"></path>
          <path d="M8 2.2c1.7 1.6 2.7 3.6 2.7 5.8S9.7 12.4 8 14"></path>
          <path d="M8 2.2c-1.7 1.6-2.7 3.6-2.7 5.8S6.3 12.4 8 14"></path>
        </svg>
      `,
      linkedin: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#ffffff">
          <rect x="2.2" y="2.2" width="11.6" height="11.6" rx="2.6" fill="none" stroke="#ffffff" stroke-width="1.3"></rect>
          <path d="M5 6.3H6.3V11H5zM5.65 4.75a.78.78 0 1 1 0 1.56.78.78 0 0 1 0-1.56ZM7.3 6.3h1.24v.64h.02c.17-.32.59-.83 1.37-.83 1.46 0 1.73.96 1.73 2.2V11h-1.3V8.94c0-.49-.01-1.12-.68-1.12-.69 0-.8.54-.8 1.09V11H7.3z"></path>
        </svg>
      `,
      github: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#ffffff">
          <rect x="2.2" y="2.2" width="11.6" height="11.6" rx="2.6" fill="none" stroke="#ffffff" stroke-width="1.3"></rect>
          <path d="M5.1 5.5h5.8v5H5.1z" fill="none"></path>
          <text x="8" y="10.2" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="4.8" font-weight="700">GH</text>
        </svg>
      `,
      skills: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#ffffff" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 2.4 9.3 5l2.8.4-2 2 .5 2.8L8 9 5.4 10.6l.5-2.8-2-2L6.7 5z"></path>
        </svg>
      `,
      languages: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2.3 4.2h6.2"></path>
          <path d="M5.4 2.5v1.7"></path>
          <path d="M4 4.2c0 3-1 5.3-2.5 6.9"></path>
          <path d="M5.4 4.2c0 2.5.9 4.8 2.6 6.9"></path>
          <path d="M3.6 7.7h3.6"></path>
        </svg>
      `,
      experience: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2.5 5.2h11a1 1 0 0 1 1 1v6.1a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V6.2a1 1 0 0 1 1-1z"></path>
          <path d="M5.4 5.2V4a1.1 1.1 0 0 1 1.1-1.1h3a1.1 1.1 0 0 1 1.1 1.1v1.2"></path>
        </svg>
      `,
      education: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 2.3 1.8 5.1 8 7.9l6.2-2.8L8 2.3z"></path>
          <path d="M3.2 6.5v2.7c0 1.1 2.1 2.6 4.8 2.6s4.8-1.5 4.8-2.6V6.5"></path>
        </svg>
      `,
      projects: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2.5" width="12" height="11" rx="2"></rect>
          <path d="M5 6h6"></path>
          <path d="M5 9h4"></path>
        </svg>
      `,
      certifications: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="8" cy="6.4" r="3.2"></circle>
          <path d="m6.5 9.2-1 4.3 2.1-1.2 1.1 1.8 1.1-4.9"></path>
        </svg>
      `,
      references: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 5.2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3.3a2 2 0 0 1-2 2H8.3L5.2 12v-1.5H5a2 2 0 0 1-2-2V5.2z"></path>
          <path d="M5.2 5.8h5.6"></path>
          <path d="M5.2 7.7h3.8"></path>
        </svg>
      `,
    };

    const iconDataUrlCache = {};

    async function getIconDataUrl(type) {
      if (!iconDataUrlCache[type]) {
        iconDataUrlCache[type] = await rasterizeSvg(iconSvgMap[type] || iconSvgMap.web);
      }

      return iconDataUrlCache[type];
    }

    async function drawContactRow(items, startX, startY, maxWidth, fontSize) {
      if (!items.length) {
        return;
      }

      const iconSize = 4.6;
      const itemGap = 4.2;
      const lineHeight = 6.1;
      let cursorX = startX;
      let cursorY = startY;

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(87, 103, 118);
      pdf.setFontSize(fontSize);

      for (const item of items) {
        const textWidth = pdf.getTextWidth(item.text || '');
        const itemWidth = 5.8 + textWidth;

        if (cursorX > startX && cursorX + itemWidth > maxWidth) {
          cursorX = startX;
          cursorY += lineHeight;
        }

        pdf.setFillColor(15, 47, 69);
        pdf.roundedRect(cursorX, cursorY + 0.5, iconSize, iconSize, 1.6, 1.6, 'F');

        try {
          const iconDataUrl = await getIconDataUrl(item.type);
          pdf.addImage(iconDataUrl, 'PNG', cursorX + 0.4, cursorY + 0.9, iconSize - 0.8, iconSize - 0.8);
        } catch (error) {
          pdf.setTextColor(255, 255, 255);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(5.2);
          pdf.text((item.fallback || '•').toUpperCase(), cursorX + (iconSize / 2), cursorY + 4.1, { align: 'center' });
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(87, 103, 118);
        }

        pdf.text(String(item.text || ''), cursorX + iconSize + 2, cursorY + 4);
        cursorX += itemWidth + itemGap;
      }
    }

    function addPageBackground(includeHeaderFrame) {
      pdf.setFillColor(247, 249, 252);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      if (includeHeaderFrame) {
        pdf.setDrawColor(225, 231, 237);
        pdf.roundedRect(margin, 8, sectionWidth, headerHeight, 6, 6, 'D');
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(margin + 1, 9, sectionWidth - 2, headerHeight - 2, 6, 6, 'F');
      }
    }

    function ensureSpace(requiredHeight) {
      if (cursorY + requiredHeight <= pageHeight - margin) {
        return;
      }

      pdf.addPage();
      addPageBackground(false);
      cursorY = pagePaddingTop;
    }

    async function drawHeaderBlock(compact) {
      const headerX = margin;
      const headerY = 8;
      const photoSize = compact ? 14 : 22;
      const photoX = headerX + 4;
      const photoY = compact ? 15 : 16;
      const textX = photoX + photoSize + 6;
      const titleY = compact ? 19 : 19;

      if (data.photo) {
        try {
          pdf.addImage(data.photo, getImageFormat(data.photo), photoX, photoY, photoSize, photoSize);
        } catch (error) {
          pdf.setFillColor(15, 47, 69);
          pdf.roundedRect(photoX, photoY, photoSize, photoSize, 4, 4, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.text(initialsFromName(data.fullName || 'CV'), photoX + (photoSize / 2), photoY + 11, { align: 'center' });
        }
      } else {
        pdf.setFillColor(15, 47, 69);
        pdf.roundedRect(photoX, photoY, photoSize, photoSize, 4, 4, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text(initialsFromName(data.fullName || 'CV'), photoX + (photoSize / 2), photoY + 11, { align: 'center' });
      }

      pdf.setTextColor(16, 33, 49);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(compact ? 13.5 : 18.5);
      pdf.text(data.fullName || 'Nombre Apellido', textX, titleY);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(77, 96, 112);
      pdf.setFontSize(compact ? 9.2 : 11);
      pdf.text(data.jobTitle || 'Titulo profesional', textX, compact ? 25.2 : 26.5);

      if (!compact) {
        const summaryLines = splitLines(data.summary || 'Sin resumen profesional disponible.', sectionWidth - (textX - headerX) - 8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(62, 81, 96);
        pdf.setFontSize(8.8);
        pdf.text(summaryLines, textX, 32);

        await drawContactRow(getContactItems(false), textX, 42.4, pageWidth - margin - 6, 8.1);

      } else {
        await drawContactRow(getContactItems(true), textX, 29.6, pageWidth - margin - 6, 7.8);
      }

      return headerHeight;
    }

    async function drawSectionTitle(title, iconType) {
      ensureSpace(12);
      cursorY += 1.5;
      const iconDataUrl = iconType ? await getIconDataUrl(iconType) : null;
      if (iconDataUrl) {
        pdf.setFillColor(15, 47, 69);
        pdf.roundedRect(margin, cursorY - 1.4, 4.9, 4.9, 1.2, 1.2, 'F');
        pdf.addImage(iconDataUrl, 'PNG', margin + 0.45, cursorY - 1.0, 4.0, 4.0);
        pdf.setTextColor(16, 33, 49);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11.5);
        pdf.text(title.toUpperCase(), margin + 6.8, cursorY + 2.5);
      } else {
        pdf.setTextColor(16, 33, 49);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11.5);
        pdf.text(title.toUpperCase(), margin, cursorY + 0.2);
      }
      cursorY += 2;
      pdf.setDrawColor(208, 217, 227);
      pdf.line(margin, cursorY + 1.8, pageWidth - margin, cursorY + 1.8);
      cursorY += 5;
    }

    async function drawCompactCards(title, items, mapper, accent, iconType) {
      if (!items.length) {
        return;
      }

      await drawSectionTitle(title, iconType);

      items.forEach((item) => {
        const block = mapper(item);
        const titleLines = splitLines(block.title, sectionWidth - 16);
        const subtitleLines = block.subtitle ? splitLines(block.subtitle, sectionWidth - 16) : [];
        const bodyLines = block.body ? splitLines(block.body, sectionWidth - 16) : [];
        const estimatedHeight = 13.5 + (titleLines.length * 4.2) + (subtitleLines.length * 3.8) + (bodyLines.length * 4.0);

        ensureSpace(estimatedHeight + 2);
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(225, 231, 237);
        pdf.roundedRect(margin, cursorY, sectionWidth, estimatedHeight, 5, 5, 'FD');
        pdf.setFillColor(accent[0], accent[1], accent[2]);
        pdf.roundedRect(margin + 2, cursorY + 2, 2, estimatedHeight - 4, 1, 1, 'F');

        pdf.setTextColor(16, 33, 49);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10.1);
        pdf.text(titleLines, margin + 8, cursorY + 8.2);

        let textY = cursorY + 8.2 + (titleLines.length * 4.1);

        if (subtitleLines.length) {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(92, 107, 122);
          pdf.setFontSize(8.2);
          pdf.text(subtitleLines, margin + 8, textY);
          textY += subtitleLines.length * 3.7 + 1;
        }

        if (bodyLines.length) {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(53, 78, 99);
          pdf.setFontSize(8.6);
          pdf.text(bodyLines, margin + 8, textY + 1);
        }

        cursorY += estimatedHeight + sectionGap;
      });
    }

    async function drawSkillPills(title, items, iconType) {
      if (!items.length) {
        return;
      }

      await drawSectionTitle(title, iconType);
      let chipX = margin;
      let chipY = cursorY + 1;
      const maxX = pageWidth - margin;
      const chipHeight = 7;

      items.forEach((item) => {
        const chipText = String(item || '').trim();
        if (!chipText) {
          return;
        }

        const chipWidth = pdf.getTextWidth(chipText) + 8;
        if (chipX + chipWidth > maxX) {
          chipX = margin;
          chipY += 9;
        }

        ensureSpace(12);
        pdf.setFillColor(236, 242, 247);
        pdf.setDrawColor(206, 215, 223);
        pdf.roundedRect(chipX, chipY, chipWidth, chipHeight, 3.5, 3.5, 'FD');
        pdf.setTextColor(16, 33, 49);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text(chipText, chipX + 4, chipY + 4.8);
        chipX += chipWidth + 2.5;
      });

      cursorY = chipY + 12;
    }

    addPageBackground(true);
    await drawHeaderBlock(false);
    cursorY = 70;

    // Draw work and education first for the PDF (header -> trabajos -> estudios -> rest)
    await drawCompactCards('Experiencia', (data.experience || []).filter((item) => item.company || item.role), (item) => ({
      title: `${item.role || 'Rol'} · ${item.company || 'Empresa'}`,
      subtitle: [item.period, item.location].filter(Boolean).join(' · '),
      body: item.achievements || '',
    }), [15, 47, 69], 'experience');

    await drawCompactCards('Educacion', (data.education || []).filter((item) => item.institution || item.degree), (item) => ({
      title: item.degree || 'Formacion',
      subtitle: [item.institution, item.period].filter(Boolean).join(' · '),
      body: item.details || '',
    }), [33, 102, 145], 'education');

    // Then draw the rest in the original order
    await drawSkillPills('Habilidades', (data.skills || []).filter((item) => item.name || item.level).map((item) => `${item.name}${item.level ? ` · ${item.level}` : ''}`), 'skills');
    await drawSkillPills('Idiomas', (data.languages || []).filter((item) => item.name || item.level).map((item) => `${item.name}${item.level ? ` · ${item.level}` : ''}`), 'languages');

    await drawCompactCards('Proyectos', (data.projects || []).filter((item) => item.name || item.description), (item) => ({
      title: item.name || 'Proyecto',
      subtitle: item.tech || '',
      body: [item.description, item.link].filter(Boolean).join(' · '),
    }), [199, 162, 106], 'projects');

    await drawCompactCards('Certificaciones', (data.certifications || []).filter((item) => item.name || item.issuer), (item) => ({
      title: `${item.name || 'Certificacion'}${item.date ? ` (${item.date})` : ''}`,
      subtitle: item.issuer || '',
      body: item.details || '',
    }), [33, 102, 145], 'certifications');

    await drawCompactCards('Referencias', (data.references || []).filter((item) => item.name || item.contact), (item) => ({
      title: item.name || 'Referencia',
      subtitle: [item.role, item.company].filter(Boolean).join(' · '),
      body: item.contact || '',
    }), [15, 47, 69], 'references');

    const safeName = (data.fullName || 'cv').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    pdf.save(`${safeName}.pdf`);
  }

  $('#cvName').text(data.fullName || 'Nombre Apellido');
  $('#cvTitle').text(data.jobTitle || 'Título profesional');
  $('#cvSummary').text(data.summary || 'Sin resumen profesional disponible.');
  $('#avatarInitials').text(initialsFromName(data.fullName || 'CV'));

  if (data.photo) {
    $('#avatarPhoto').attr('src', data.photo).removeClass('d-none');
    $('#avatarInitials').addClass('d-none');
  }

  $('#cvContactPrimary').html([
    renderContactItem('Email', data.email),
    renderContactItem('Teléfono', data.phone),
    renderContactItem('Ubicación', data.location),
  ].join(''));

  $('#cvContactLinks').html([
    renderContactItem('Web', data.website, true),
    renderContactItem('LinkedIn', data.linkedin, true),
    renderContactItem('GitHub', data.github, true),
  ].join(''));

  const skillItems = (data.skills || []).filter((item) => item.name || item.level);
  const languageItems = (data.languages || []).filter((item) => item.name || item.level);
  $('#cvSkills').html(skillItems.length ? skillItems.map(renderCompetency).join('') : '<div class="empty-state compact-empty">Sin habilidades registradas.</div>');
  $('#cvLanguages').html(languageItems.length ? languageItems.map(renderLanguage).join('') : '<div class="empty-state compact-empty">Sin idiomas registrados.</div>');

  $('#cvCertifications').html((data.certifications || []).filter((item) => item.name || item.issuer).map(renderCertification).join('') || '<div class="empty-state compact-empty">Sin certificaciones registradas.</div>');
  $('#cvReferences').html((data.references || []).filter((item) => item.name || item.contact).map(renderReference).join('') || '<div class="empty-state compact-empty">Sin referencias registradas.</div>');

  $('#cvExperience').html((data.experience || []).filter((item) => item.company || item.role).map(renderExperience).join('') || '<div class="empty-state">Sin experiencia registrada.</div>');
  $('#cvEducation').html((data.education || []).filter((item) => item.institution || item.degree).map(renderEducation).join('') || '<div class="empty-state">Sin formación registrada.</div>');
  $('#cvProjects').html((data.projects || []).filter((item) => item.name || item.description).map(renderProject).join('') || '<div class="empty-state">Sin proyectos destacados.</div>');

  async function downloadPdf() {
    await generateFallbackPdf();
  }

  $('#downloadPdf').on('click', function () {
    $(this).prop('disabled', true).text('Generando...');
    downloadPdf()
      .catch(function () {
        alert('No se pudo generar el PDF. Revisa que el navegador permita la captura.');
      })
      .finally(() => {
        $('#downloadPdf').prop('disabled', false).text('Descargar PDF');
      });
  });

});