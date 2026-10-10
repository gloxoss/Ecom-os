import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isOwnedBrand,
  getBrandStory,
  validateBrandStoryMetadata,
  paralocaBrandStories,
} from './brand-schema';

describe('ParaLoca Brand Metadata & Schema Contract (ECO-804)', () => {
  it('correctly classifies owned brand vs third-party distributor brands', () => {
    assert.equal(isOwnedBrand('paraloca'), true);
    assert.equal(isOwnedBrand('rossmax'), false);
    assert.equal(isOwnedBrand('omron'), false);
    assert.equal(isOwnedBrand('unknown-brand'), false);
  });

  it('retrieves detailed brand story and optional warranty documentation', () => {
    const ownedStory = getBrandStory('paraloca');
    assert.ok(ownedStory);
    assert.equal(ownedStory.name, 'ParaLoca Équipements');
    assert.equal(ownedStory.origin, 'Maroc');
    assert.ok(ownedStory.warrantyPolicy?.includes('Casablanca'));
    assert.ok(Array.isArray(ownedStory.documents));
    assert.equal(ownedStory.documents?.length, 2);

    const partnerStory = getBrandStory('rossmax');
    assert.ok(partnerStory);
    assert.equal(partnerStory.origin, 'Suisse');
    assert.equal(partnerStory.isOwned, false);
    assert.equal(partnerStory.documents, undefined);
  });

  it('validates brand story metadata structure and throws on invalid shapes', () => {
    const valid = validateBrandStoryMetadata(paralocaBrandStories.paraloca);
    assert.equal(valid.slug, 'paraloca');

    assert.throws(
      () => validateBrandStoryMetadata(null),
      /Brand story metadata must be a non-null object/
    );

    assert.throws(
      () => validateBrandStoryMetadata({ slug: 'missing-name' }),
      /Brand story metadata missing required fields/
    );
  });

  it('guarantees that brand story does not alter canonical product price or SKU fields', () => {
    // Assert invariant: BrandStory contains purely editorial & documentation metadata
    const storyKeys = Object.keys(paralocaBrandStories.paraloca);
    assert.equal(storyKeys.includes('price'), false);
    assert.equal(storyKeys.includes('stock'), false);
    assert.equal(storyKeys.includes('taxRate'), false);
  });
});
