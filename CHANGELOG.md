# Changelog

## v0.4.5 - Linked library paths and result-page focus

- Expanded the internal philosophy library from flat category lists into guided reading paths with cross-category links between archetypes, philosophers, schools, and readings.
- Added archetype-specific library guide questions and bridge notes so the encyclopedia can carry more philosophy content without changing quiz scoring.
- Refined the homepage copy to make friend sharing and result comparison clearer while keeping the test framed as philosophical self-understanding.
- Reordered the result page so the core result, share panel, five-domain portrait, and key interpretation appear before deeper reading.
- Moved full archetype deep reading out of the result page flow and into the library detail experience, reducing result-page density.
- Strengthened share copy and share card invitation language without adding public result URLs, percentages, QR codes, external links, login, database, or analytics.
- Kept the question set, fifteen archetypes, and core scoring algorithm unchanged.

## v0.4.0 - Share-first homepage and internal philosophy library

- Reframed the first screen as a philosophical self-understanding test, explicitly separating it from psychological diagnosis and mystical entertainment.
- Added a pre-test outcome preview for five-domain portraits, archetype interpretation, share cards, and the internal philosophy library.
- Added a lightweight internal library view with category browsing for archetypes, philosophers, schools, and reading recommendations.
- Reused v0.3 knowledge data for library cards and in-page detail modals, including related archetype links without external navigation.
- Strengthened result-page continuation paths into the internal library after sharing or reading the primary archetype.
- Updated share copy with a public homepage invitation while keeping raw archetype match percentages out of share text.
- Kept the v0.3 question set, fifteen archetypes, and core scoring algorithm unchanged.

## v0.3.0 - Expanded result experience

- Added fifteen new archetype-specific illustrations and moved result images to dedicated archetype asset paths.
- Added internal archetype encyclopedia content with deeper interpretation, philosopher cards, school cards, and reading recommendations.
- Added archetype portrait content focused on decision style, action style, relationship pattern, misreadings, and growth edges.
- Added a result-page deep reading section with in-page detail modals rather than external links.
- Recalibrated question wording so philosophical reasons are separated from generic good-answer cues, including rule-utilitarian and pragmatist paths.
- Diversified classic problem coverage across all five domains, especially reducing ontology's overreliance on same-object continuity puzzles.
- Added share helpers, improved share copy, a portrait share card, optional personal notes, and PNG export support.
- Kept archetype match scores out of user-facing share content while showing five-domain result data.

## v0.2.7 - Match strength and mixed profile presentation

- Reframed result presentation from raw numeric match scores to match strength labels: clear, leaning, light, and mixed.
- Kept distance-based archetype sorting as an internal score without normalizing the current maximum to 100.
- Added five-domain profile highlights so mixed results can be read as a philosophical pattern rather than a failed archetype match.
- Updated result copy, related archetype labels, and share text to avoid treating the result as an exam-like percentage.
- Kept the v0.2.6 question model, 80/20 scoring weight, and hand-written archetype library unchanged.

## v0.2.6 - Cross-domain thought experiment model

- Reworked thought experiments into four integrated scenarios with five hidden domain steps each.
- Moved experiment scoring from scenario-level dimensions to step-level dimensions, reducing single-scene bias.
- Kept ten low-cue calibration questions and the 80/20 experiment/calibration weighting, with ranking calibration for multi-tradition domains.
- Added internal representativeness tests for domain coverage, tradition balance, archetype reachability, and simulated result concentration.
- Updated path replay to show the plain-language focus of each decision step.

## v0.2.5 - Five-domain thought experiment model

- Reworked the assessment into five philosophy domains: epistemology, ontology, ethics, political/social philosophy, and life/meaning philosophy.
- Added five thought experiments with twenty costed choice steps as the primary scoring surface.
- Rewrote the experiment and calibration prompts to avoid repeated scenarios, reduce academic wording, and reveal only the selected option's cost after selection.
- Kept ten low-cue paired calibration items and combined them with thought experiments at an 80/20 weight.
- Replaced the four-axis vector with a mixed model: two axis scores plus three multi-tradition distributions.
- Rebuilt the result system around fifteen hand-written archetypes, dynamic five-domain profiles, and thought experiment path replay.
- Reworked calibration from agree/disagree Likert items into two-sided reflective choices so the shorter check remains more philosophically pointed.

## v0.2.1 - Mixed method and low-cue quiz flow

- Reworked the question set into 24 Likert items, 8 two-choice value conflicts, and 4 optional subjective reflections.
- Hid dimension names, endpoint labels, and item direction cues from the quiz flow to reduce answer priming.
- Randomized scored questions on each restart while keeping optional reflections at the end.
- Added conflict scoring and preserved subjective answers for result-page reflection without including them in the score.
- Updated tests for mixed question balance, conflict scoring, optional subjective answers, and deterministic shuffling.

## v0.2.0 - Likert spectrum model

- Reworked the test from 20 forced-choice scenarios into 32 five-point Likert items.
- Reframed the four dimensions as philosophy spectrum axes: experience/reason, self-generated meaning/purpose order, consequence/principle, and individual/community.
- Expanded results from eight archetypes to sixteen spectrum archetypes with philosophy school labels and academic notes.
- Updated scoring to average reverse-keyed Likert items by dimension and match results against 16 axis signatures.
- Updated the quiz and result views for Likert answering, ideology spectrum tags, and clearer non-diagnostic wording.
- Verified updated content/scoring tests and production build.

## v0.1.0 - Local prototype

- Built a pure frontend React/Vite philosophy archetype test.
- Added 20 scenario questions, four continuous philosophy dimensions, and eight result archetypes.
- Added result illustrations, result interpretation, dimension profile, related philosophers, schools, and copyable summary.
- Verified unit tests, production build, and desktop/mobile browser flow.
