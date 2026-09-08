# Contributing

## GitHub workflow

1. Create or choose a GitHub Issue with one clear outcome.
2. Update local `main`, then create a short branch such as `feat/label-detail`, `fix/price-copy`, or `research/scenario-2`.
3. Keep changes focused. Do not combine visual redesign, research wording and product-data changes in one Pull Request.
4. Run `npm run verify:data` and `npm run build` before opening the Pull Request.
5. Link the Issue in the Pull Request and request at least one teammate review.
6. Use squash merge after approval and delete the merged branch.

Recommended repository rules:

- require a Pull Request before merging to `main`;
- require one approval;
- require the data and build checks to pass;
- block force pushes and branch deletion on `main`.

## Research-prototype discipline

- Do not change Condition A and Condition B independently unless the evaluation design requires it.
- Product, image, quantity and actual current price must remain identical across the two conditions.
- All savings must be calculated from `originalPriceCents - currentPriceCents`.
- Keep unconfirmed source values marked `not verified`.
- Record the deployed version and session URL used for each participant group.
- Do not add names, emails, consent records or other identifying participant data to this repository.

## Pull Request checklist

- The linked evaluation question is stated.
- Participant-facing wording is plain and neutral.
- Keyboard and mobile use still work.
- Product-data verification passes.
- The production build passes.
- Screens shown to participants have a stable Condition and scenario URL.
