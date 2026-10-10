import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { paralocaProfile } from './profile';
import { defaultParaLocaContent } from './content-schema';

describe('Medical & Legal Content Approval Contract (ECO-806)', () => {
  it('enforces mandatory regulated product notice on ParaLoca profile', () => {
    assert.ok(paralocaProfile.industry);
    assert.ok(paralocaProfile.industry.regulatedProductNotice);
    assert.ok(
      paralocaProfile.industry.regulatedProductNotice.includes(
        'Dispositifs médicaux et matériel de maintien à domicile'
      )
    );
    assert.ok(
      paralocaProfile.industry.regulatedProductNotice.includes(
        'recommandations des professionnels de santé'
      )
    );
  });

  it('guarantees all published equipment guides include medical disclaimers', () => {
    const guides = defaultParaLocaContent.guides;
    assert.ok(guides.length > 0);
    for (const guide of guides) {
      assert.ok(guide.disclaimer.length > 15);
      assert.ok(
        guide.disclaimer.toLowerCase().includes('ne remplace pas une prescription') ||
          guide.disclaimer.toLowerCase().includes('soignante')
      );
    }
  });

  it('verifies absence of prohibited marketing claims in public catalog content', () => {
    const prohibitedTerms = [
      'guérison garantie',
      'approuvé oms',
      'remboursement 100% cnss garanti',
      'certificat fda exclusif',
    ];

    const contentJson = JSON.stringify(defaultParaLocaContent).toLowerCase();
    for (const term of prohibitedTerms) {
      assert.equal(
        contentJson.includes(term),
        false,
        `Prohibited term "${term}" must not appear in public catalog content`
      );
    }
  });

  it('verifies that content approval dossier document exists and specifies Law 84-12 framework', () => {
    const dossierPath = path.join(__dirname, 'content-approval.md');
    assert.ok(fs.existsSync(dossierPath));
    const content = fs.readFileSync(dossierPath, 'utf8');
    assert.ok(content.includes('Law 84-12'));
    assert.ok(content.includes('Zero Invented Registrations'));
    assert.ok(content.includes('Zero Clinical Superiority Claims'));
  });
});
