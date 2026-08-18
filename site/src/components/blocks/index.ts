// Barrel for the slide engine. Decks (in content/) import from here:
//   import { Slide, Bullets, Quiz, … } from '@components/blocks';

// Slide wrapper
export { default as Slide } from './Slide.astro';

// Blocks
export { default as Bullets } from './Bullets.astro';
export { default as ThreeCol } from './ThreeCol.astro';
export { default as SqlWalk } from './SqlWalk.astro';
export { default as JoinCompare } from './JoinCompare.astro';
export { default as Schema } from './Schema.astro';
export { default as DataTable } from './DataTable.astro';
export { default as CodeBlock } from './CodeBlock.astro';
export { default as Demo } from './Demo.astro';
export { default as Cta } from './Cta.astro';
export { default as Quiz } from './Quiz.astro';
export { default as CoverMeta } from './CoverMeta.astro';

// Layout wrappers
export { default as TwoColumn } from './TwoColumn.astro';
export { default as ImageCaption } from './ImageCaption.astro';
export { default as ChartPane } from './ChartPane.astro';
export { default as FullBleed } from './FullBleed.astro';
export { default as CardGrid } from './CardGrid.astro';

// Inline text renderer (helper; usable directly if needed)
export { default as Inline } from './Inline.astro';
