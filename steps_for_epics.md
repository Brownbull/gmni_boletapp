PHASE 2: Epic 4 - Security Hardening (Infrastructure Epic)
Sequence:
Step	Command	Output
1	/bmad:bmm:workflows:tech-spec	Creates tech spec with stories for Epic 4
2	/bmad:bmm:workflows:create-story	Creates first story (3.1 pattern - run for each story)
3	/bmad:bmm:workflows:story-ready	Marks story ready for development
4	/bmad:bmm:workflows:dev-story	Execute story implementation
5	/bmad:bmm:workflows:code-review	Senior dev review
6	/bmad:bmm:workflows:story-done	Mark story complete
7	Repeat 2-6 for each story	
8	/bmad:bmm:workflows:retrospective	Epic 4 retrospective
Note: Epic 4 is infrastructure work, so you can skip PRD and go straight to tech-spec.
PHASE 3: Epic 5 - Enhanced Data Export (Feature Epic)
Sequence (Full Feature Workflow):
Step	Command	Output	New Team Members
1	/bmad:bmm:workflows:product-brief	Product vision document	Mary (Analyst)
2	/bmad:bmm:workflows:prd	Detailed PRD	Alice (PM), Mary
3	/bmad:bmm:workflows:create-ux-design	UX design specs	Sally (UX Designer)
4	/bmad:bmm:workflows:architecture	Technical architecture	Winston (Architect)
5	/bmad:bmm:workflows:tech-spec	Tech spec with stories	
6	/bmad:bmm:workflows:create-story	Create each story	Paige (Tech Writer) for docs
7-12	story-ready → dev-story → code-review → story-done	Per story	
13	/bmad:bmm:workflows:retrospective	Epic 5 retrospective	
PHASE 4: Epic 6 - Smart Category Learning (Complex Feature Epic)
Same sequence as Epic 5, but with extra attention to:
Step	Command	Special Focus
1	/bmad:bmm:workflows:product-brief	AI/ML behavior definition
2	/bmad:bmm:workflows:prd	User preference storage requirements
3	/bmad:bmm:workflows:create-ux-design	Category override UX, learned categories management
4	/bmad:bmm:workflows:architecture	New Firestore collection design, fuzzy matching algorithm
5	/bmad:bmm:workflows:tech-spec	Gemini integration changes
Consider: /bmad:bmm:workflows:domain-research for AI/ML best practices in category learning
PHASE 5: Epic 7 - Subscription & Monetization (Business-Critical Epic)
Same sequence as Epic 5, plus:
Step	Command	Special Focus
1	/bmad:bmm:workflows:product-brief	Tier definitions, pricing strategy
2	/bmad:bmm:workflows:research	Mercado Pago integration research
3	/bmad:bmm:workflows:prd	Usage metering, rate limiting, billing flows
4	/bmad:bmm:workflows:create-ux-design	Subscription management UX, upgrade flows
5	/bmad:bmm:workflows:architecture	Payment integration, usage tracking, security
Security Note: Run security review on payment flows before deployment.
PHASE 6: Epic 8 - Mobile App (Platform Expansion Epic)
Extended sequence:
Step	Command	Special Focus
1	/bmad:bmm:workflows:product-brief	Platform strategy (React Native vs Native vs PWA)
2	/bmad:bmm:workflows:research	App Store requirements, in-app purchase rules
3	/bmad:bmm:workflows:prd	Mobile-specific features, offline mode
4	/bmad:bmm:workflows:create-ux-design	Mobile UX patterns, touch interactions
5	/bmad:bmm:workflows:architecture	Mobile architecture, dual payment integration
Consider: May need mobile specialist consultation.