const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const inputHtml = process.argv[2];
const outputJsx = process.argv[3];

if (!inputHtml || !outputJsx) {
  console.log("Usage: node html-to-jsx.js <input.html> <output.tsx>");
  process.exit(1);
}

const content = fs.readFileSync(inputHtml, 'utf8');
const $ = cheerio.load(content);

// Remove scripts and styles
$('script').remove();
$('style').remove();
$('noscript').remove();

// Remove Header and Footer (assuming we already built them)
$('.navbar-light').remove();
$('.search-desktop').remove();
$('.footer').remove();
$('.hero-section').first().addClass('mt-[-80px]'); // compensate for sticky header if needed

// Remove data-w-id to remove Webflow interactions
$('*').removeAttr('data-w-id');
$('*').removeAttr('data-wf-page-id');
$('*').removeAttr('data-wf-element-id');
$('*').removeAttr('data-wf-ignore');
$('*').removeAttr('data-wf-site');
$('*').removeAttr('data-animation');
$('*').removeAttr('data-easing2');
$('*').removeAttr('data-easing');
$('*').removeAttr('data-collapse');
$('*').removeAttr('data-duration');
$('*').removeAttr('data-doc-height');

// Convert specific attributes to React equivalents
let htmlBody = $('body').html();

// Basic HTML to JSX conversions
htmlBody = htmlBody.replace(/class="/g, 'className="');
htmlBody = htmlBody.replace(/for="/g, 'htmlFor="');
htmlBody = htmlBody.replace(/srcset="/g, 'srcSet="');
htmlBody = htmlBody.replace(/tabindex="/g, 'tabIndex="');
htmlBody = htmlBody.replace(/readonly="/g, 'readOnly="');
htmlBody = htmlBody.replace(/maxlength="/g, 'maxLength="');
htmlBody = htmlBody.replace(/autoplay="/g, 'autoPlay="');
htmlBody = htmlBody.replace(/playsinline="/g, 'playsInline="');

// Fix inline styles - just remove them for now or convert if simple
// Webflow inline styles usually break JSX because they are strings.
// A regex to transform `style="..."` to `style={{...}}` is complex, so let's strip them or try simple ones.
// Often Webflow puts `opacity: 0` or `background-image: url(...)`.
htmlBody = htmlBody.replace(/style="([^"]*)"/g, (match, p1) => {
  const css = p1.trim();
  if (!css) return '';
  const obj = css.split(';').reduce((acc, rule) => {
    if (!rule.trim()) return acc;
    const [key, value] = rule.split(':');
    if (!key || !value) return acc;
    const camelKey = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
    acc.push(`${camelKey}: '${value.trim().replace(/'/g, "\\'")}'`);
    return acc;
  }, []);
  return `style={{ ${obj.join(', ')} }}`;
});

// Self-close tags like img, input, br, hr, source
const voidElements = ['img', 'input', 'br', 'hr', 'source', 'meta', 'link'];
voidElements.forEach(tag => {
  const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi');
  htmlBody = htmlBody.replace(regex, `<${tag}$1 />`);
});

// Also remove empty class names which Webflow sometimes outputs
htmlBody = htmlBody.replace(/className=""/g, '');

const componentName = path.basename(outputJsx, '.tsx').split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');

const template = `
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function ${componentName}() {
  return (
    <>
      ${htmlBody}
    </>
  );
}
`;

fs.writeFileSync(outputJsx, template);
console.log(`Successfully converted ${inputHtml} to JSX at ${outputJsx}`);
