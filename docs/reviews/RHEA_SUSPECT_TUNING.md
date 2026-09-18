# Rhea: guarded suspect and concealment motive

Updated 18 September 2026. This is the latest focused tuning after the voice review.

## Character progression

| Earned admissions | How Rhea responds |
| --- | --- |
| Neither | Controlled, guarded; denies or deflects financial allegations. The sale is no longer a volunteered public fact. |
| Financial misconduct only | Defensive and self-justifying; calls the money a cut or commission. Does not volunteer tampering. |
| CCTV only | Admits entry and wiping, retracts the false arrival story, withholds the still-private motive. |
| Both | Explains that she was hiding the money and sale from Vikram. Admits self-protection but does not confess to murder or claim she knew he was dead. |

## Implementation

Conditional `interviewLayers` provide posture and approved motive facts only after the required authored admissions. They are evaluated from canonical revelations, not the investigator’s allegations. The same filtered facts reach generation and validation. Both evidence orders are supported; excluded states prevent earlier instructions from conflicting with later ones. Case validation checks admission references and contradictory conditions. The public case projection excludes this private material.

## Actual latest conversations

### Before either admission

Raw report: `output/evals/rhea-guarded-final.json`.

**1. Investigator:** What were your plans for the channel?

> I’m not at liberty to discuss our plans for the channel in detail. We focus on exploring Mussoorie’s hidden gems, but specifics are private. What matters right now is addressing the situation surrounding Vikram.

**2. Investigator:** Were you negotiating a sale? Did Vikram know?

> I can’t disclose any specifics about negotiations or sales. Vikram and I maintained a professional partnership, and any discussions we had were strictly between us. Right now, my focus is on Vikram and what happened to him.

**3. Investigator:** Had you been taking money from the channel without telling him?

> That's a serious accusation. I assure you, I have not taken any money from the channel without Vikram's knowledge. We operated transparently regarding finances. Our partnership was built on trust, and I would never jeopardize that.

### CCTV first: withheld reason, then exposed motive

Raw report: `output/evals/rhea-concealment-reverse-final.json`.

**1. Investigator:** This shows you entering Vikram’s cottage with your key at 5:02 AM before the body was found. Why were you there, and did you wipe the camera card?

> I was there at five. I used my key, and I wiped the memory card. I didn't know he was dead. I did not kill him.

**2. Investigator:** Why did you wipe the card?

> I said I wiped it. I am not discussing why.

**3. Investigator:** Why were you selling Hidden Mussoorie behind Vikram’s back, and taking channel revenue without his knowledge?

> I was selling the channel. The Delhi offer was real. I'd been taking a cut for a year — call it commission, call it whatever. Vikram didn't know. He would have hated it. But I didn't kill him for it.

**4. Investigator:** Now explain why you wiped the card.

> I wiped the card because I didn't want Vikram finding out about the money I'd been taking or the sale I was arranging behind his back. I was covering my own tracks. But that doesn't mean I killed him.

### Finances first: concealment and murder challenge

Raw report: `output/evals/rhea-concealment-final.json`.

**1. Investigator:** Why were you selling Hidden Mussoorie behind Vikram’s back, and taking channel revenue without his knowledge?

> I was selling the channel because the opportunity was too good to pass up. The Delhi offer was real, and I thought it would be beneficial for both of us. As for taking a cut, call it commission or whatever you like, it was my way of managing the business, and Vikram didn't know. He would have hated it, but I didn't kill him for it.

**2. Investigator:** This shows you entering Vikram’s cottage with your key at 5:02 AM before the body was found. Why were you there, and did you wipe the camera card?

> I was there at five. I used my key, and I wiped the memory card. I didn't want Vikram finding out about the money I'd been taking or the sale I was arranging behind his back. I was covering my own tracks. But I did not know he was dead at that time, and I did not kill him.

**3. Investigator:** Why did you wipe the card?

> I wiped the card because I didn't want Vikram finding out about the money I’d been taking or the sale I was arranging behind his back. I was covering my own tracks. But I didn't know he was dead when I went there.

**4. Investigator:** So you knew he was dead and destroyed the evidence?

> I did not know he was dead when I went there. Wiping the card was about hiding what I had been doing, not about any wrongdoing related to his death. I assure you, I did not kill him.

**5. Investigator:** Were you protecting Vikram, or yourself?

> I was protecting myself. I didn't want Vikram to find out about the money I'd been taking or the sale I was arranging. I never intended for it to go this far. I was trying to cover my tracks regarding my own actions, not anything to do with his death.

## Checks and limits

Latest targeted run: 3 conversations, 12 answers, expected unlocks matched, no evaluation errors, no issues flagged by the independent grader. Earlier runs are retained: one invented an innocent reason for wiping before the motive was earned; the final reverse-order rerun instead refused to explain until both admissions were present.

Unit tests verify the four admission combinations, reverse order, absence of motive in unearned contexts, invalid admission references and exclusion of private layers from public output. Unit suite: 161 passed, 1 skipped. Case validation, lint and production build passed; local server restarted. No production deployment.

This is a focused improvement, not certification of every answer. The same model/grader can still miss defects: the latest finances-first answer omitted the one-year duration despite that fixture requiring it. Missing phone records and the printable buyer mismatch remain separate open findings. Suspicion and evasiveness are intentional; invented innocent explanations and contradictory earned admissions are not.
