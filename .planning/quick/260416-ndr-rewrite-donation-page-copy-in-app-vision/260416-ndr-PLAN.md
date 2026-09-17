---
phase: 260416-ndr-rewrite-donation-page-copy-in-app-vision
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/vision.tsx
autonomous: true
requirements:
  - APPSTORE-3.1.1-DONATION-COPY
must_haves:
  truths:
    - "Donation-facing copy frames contributions as supporting The Deen Foundation's charitable mission, not the app's operation/features/infrastructure."
    - "No donation-facing copy in app/vision.tsx contains the words 'server', 'servers', 'we run', 'keep ... free', or 'funds every'."
    - "The 501(c)(3) badge text, the 'Opens thedeenfoundation.com' hint, the Mission section text, and the first two pillar cards are preserved exactly as before."
    - "File structure, imports, styles, icons, animations, and component logic are unchanged — only JSX text nodes are modified."
  artifacts:
    - path: "app/vision.tsx"
      provides: "App Store 3.1.1-compliant donation page copy"
      contains: "Support The Deen Foundation"
  key_links:
    - from: "app/vision.tsx hero donate pill (TouchableOpacity onPress={handleDonate})"
      to: "EXTERNAL_URLS.DONATE (thedeenfoundation.com)"
      via: "existing handleDonate handler — unchanged"
      pattern: "onPress=\\{handleDonate\\}"
    - from: "app/vision.tsx CTA button"
      to: "EXTERNAL_URLS.DONATE (thedeenfoundation.com)"
      via: "existing handleDonate handler — unchanged"
      pattern: "onPress=\\{handleDonate\\}"
---

<objective>
Rewrite five donation-facing copy strings in app/vision.tsx so they reframe donations as support for The Deen Foundation's charitable mission (Shia Islamic education, qualified scholars, community programs combating misinformation) rather than as funding the app's digital services/operation/infrastructure.

Purpose: Resolve App Store 3.1.1 rejection. Apple's carve-out for 501(c)(3) external donations requires donation copy to clearly position contributions as supporting the nonprofit's charitable mission, not the app.

Output: An updated `app/vision.tsx` with five specific text nodes replaced — no other changes.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@app/vision.tsx

<interfaces>
<!-- Key context the executor needs to make surgical text edits. -->
<!-- All imports, styles, icons, animations, and component structure in app/vision.tsx MUST remain unchanged. -->
<!-- Only the five JSX text nodes below are modified. Line numbers are approximate (from the current file). -->

Touchpoints in app/vision.tsx (preserve all surrounding JSX/style/attribute code):

1. Hero donate pill text node — inside <ThemedText style={[styles.heroDonatePillText, { color: colors.primary }]}> around line 172.
2. Third pillar — the <Pillar ...> element around lines 221-226 with icon="heart-circle-outline". Only `title` and `description` props change.
3. CTA heading text node — inside <ThemedText style={styles.ctaHeading}> around lines 234-236.
4. CTA body text node — inside <ThemedText style={[styles.ctaBody, { color: colors.textSecondary }]}> around lines 237-240.
5. CTA button text node — inside <ThemedText style={styles.ctaText}> around line 254.

DO NOT TOUCH:
- 501(c)(3) badge (around lines 144-148)
- Mission section (around lines 184-202)
- First two <Pillar> elements — icons "sparkles" and "globe-outline" (around lines 206-219)
- 'Opens thedeenfoundation.com' hint (around lines 258-260)
- handleDonate handler, handlePress logic, imports, StyleSheet, animations, icons, component structure
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace five donation-facing text nodes in app/vision.tsx</name>
  <files>app/vision.tsx</files>
  <action>
    Use the Edit tool to make FIVE exact string replacements in `app/vision.tsx`. Each replacement changes only the visible text inside a JSX text node. Do not modify any surrounding JSX, props, styles, imports, icons, or animations. Do not reformat untouched lines.

    ## Replacement 1 — Hero donate pill (around L172)

    Find:
    ```
                    We run on donations · Tap to give
    ```

    Replace with:
    ```
                    Support The Deen Foundation
    ```

    (The surrounding `<ThemedText style={[styles.heroDonatePillText, { color: colors.primary }]}>...</ThemedText>`, the heart icon, and the arrow-forward icon all stay exactly as they are.)

    ## Replacement 2 — Third pillar title + description (around L220-226)

    Find:
    ```
              <Pillar
                icon="heart-circle-outline"
                title="Powered by community"
                description="We run entirely on your donations — no ads, no subscriptions."
                delay={660}
                colors={colors}
              />
    ```

    Replace with:
    ```
              <Pillar
                icon="heart-circle-outline"
                title="Independent & mission-driven"
                description="The Deen Foundation is donor-funded so it can serve the ummah free of commercial pressure — no ads, no subscriptions."
                delay={660}
                colors={colors}
              />
    ```

    (The icon, delay, and colors props are unchanged. Only `title` and `description` strings change.)

    ## Replacement 3 — CTA heading (around L234-236)

    Find:
    ```
              <ThemedText style={styles.ctaHeading}>
                Help keep Deen free for the ummah.
              </ThemedText>
    ```

    Replace with:
    ```
              <ThemedText style={styles.ctaHeading}>
                Support authentic Shia Islamic education.
              </ThemedText>
    ```

    ## Replacement 4 — CTA body (around L237-240)

    Find:
    ```
              <ThemedText style={[styles.ctaBody, { color: colors.textSecondary }]}>
                Your tax-deductible gift funds every server, every teacher, every
                lesson.
              </ThemedText>
    ```

    Replace with:
    ```
              <ThemedText style={[styles.ctaBody, { color: colors.textSecondary }]}>
                Your tax-deductible gift to The Deen Foundation supports
                authentic Shia Islamic education, qualified scholars, and
                community programs combating misinformation.
              </ThemedText>
    ```

    ## Replacement 5 — CTA button text (around L254)

    Find:
    ```
                  <ThemedText style={styles.ctaText}>Support Deen</ThemedText>
    ```

    Replace with:
    ```
                  <ThemedText style={styles.ctaText}>Support The Deen Foundation</ThemedText>
    ```

    ## Rationale (why this satisfies App Store 3.1.1)

    - Reframes every donation CTA around supporting The Deen Foundation (a 501(c)(3) nonprofit) and its charitable mission — Shia Islamic education, scholars, combating misinformation, community outreach.
    - Removes all app-infrastructure language: no "server(s)", no "we run on donations", no "keep Deen free", no "funds every ...".
    - Preserves the 501(c)(3) badge, the Mission section, the first two pillars, and the "Opens thedeenfoundation.com" hint — these are already compliant.
  </action>
  <verify>
    <automated>grep -nE -i "server|we run|keep .*free|funds every|Powered by community|Support Deen[^ ]" app/vision.tsx; test $? -eq 1 &amp;&amp; grep -q "Support The Deen Foundation" app/vision.tsx &amp;&amp; grep -q "Independent &amp; mission-driven" app/vision.tsx &amp;&amp; grep -q "Support authentic Shia Islamic education" app/vision.tsx &amp;&amp; grep -q "combating misinformation" app/vision.tsx &amp;&amp; npm run lint</automated>
  </verify>
  <done>
    - All five text nodes replaced exactly as specified above.
    - `grep -i "server\|keep.*free\|we run\|funds every" app/vision.tsx` returns no matches.
    - `grep -q "Support The Deen Foundation" app/vision.tsx` succeeds (appears in hero pill and CTA button).
    - `grep -q "Independent & mission-driven" app/vision.tsx` succeeds.
    - `grep -q "combating misinformation" app/vision.tsx` succeeds.
    - `grep -q "501(c)(3) Non-Profit" app/vision.tsx` still succeeds (badge preserved).
    - `grep -q "Opens thedeenfoundation.com" app/vision.tsx` still succeeds (hint preserved).
    - `grep -q "Rooted in tradition" app/vision.tsx` and `grep -q "Accessible to all" app/vision.tsx` still succeed (first two pillars preserved).
    - `grep -q "Knowledge that moves with you" app/vision.tsx` still succeeds (Mission heading preserved).
    - `npm run lint` passes with no new errors or warnings in app/vision.tsx.
    - No imports, styles, icons, animations, handlers, or component structure modified.
  </done>
</task>

</tasks>

<verification>
1. Run `npm run lint` — must pass with no new errors/warnings introduced to `app/vision.tsx`.
2. Run the grep commands listed in the task's `<done>` block and confirm each one returns the expected result.
3. Spot-check `git diff app/vision.tsx` — the diff should show exactly the five text-node changes and nothing else (no style, import, or structural drift).
</verification>

<success_criteria>
- `app/vision.tsx` contains the exact five replacement strings specified in the action.
- No donation-facing copy in the file mentions "server", "servers", "we run", "keep ... free", or "funds every".
- Hero donate pill, third pillar, CTA heading, CTA body, and CTA button all reference The Deen Foundation's charitable mission.
- 501(c)(3) badge, Mission section, first two pillars, and 'Opens thedeenfoundation.com' hint are unchanged.
- `npm run lint` passes.
- `git diff --stat app/vision.tsx` shows only text-node line changes (no churn in imports or styles).
</success_criteria>

<output>
After completion, create `.planning/quick/260416-ndr-rewrite-donation-page-copy-in-app-vision/260416-ndr-SUMMARY.md` documenting the final strings written to `app/vision.tsx` and the verification output.
</output>
