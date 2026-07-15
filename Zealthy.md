# Zealthy \- Full Stack Engineering Exercise

*This exercise is designed to screen for technical soundness and also better understand*  
*management philosophy.I am looking for style and quality of code.*

The coding exercise is to create a mini-EMR and Patient Portal application. Providers would like to be able to manage patients via the mini-EMR, such as scheduling appointments and prescribing medications. Patients should be able to view their upcoming appointments and medication refills, etc. The app should be broken down into the two sections outlined below. Example JSON data is provided below, but a database should be employed such that new entries can be added, and existing ones modified.

Section 1 \- The “mini” EMR

This is to be an admin interface with just a small fraction of the features normally found on an EMR application. The EMR should reside at the url path “/admin” and should **not** require authentication (normally it would, of course). The main page should be a table of users in the system. Some at-a-glance data should be visible on this table. Admins should then be able to drill down into a patient record and view their upcoming appointments and list of prescribed medications. Sample data for these is included as JSON below.

Some requirements of the mini-EMR:  
\* Patient prescriptions can be managed (CRUD)  
\* Patient appointments can be managed (CRUD)  
\* Patient data can be managed (CRU) \- so a New patient form needs to allow creation as well

Section 2 \- The Patient Portal

A way for patients to view their info such as upcoming appointments and medication refills. The Patient Portal should reside at the root “/“ path of the application. A login form should be displayed with email and password fields for the patient to login. One should be able to login with the sample credentials provided, or with credentials entered when creating new users via the EMR.

The main page of the Patient Portal should provide the patient with a summary of the most important data—any appointments within the next 7 days, any medications with refills scheduled in the next 7 days, and basic patient info.

Some requirements of the Patient Portal:  
\* Patients should be able to drill down and see their full upcoming appointment schedule  
\* Patients should be able to drill down and see info about all of their prescriptions

Please submit your completed exercise URLs for both the github repository as well as a deployed application somewhere (Vercel, Netlify, Heroku, AWS, etc)   
JSON data to seed your application can be found at:  
[https://gist.github.com/sbraford/73f63d75bb995b6597754c1707e40cc2](https://gist.github.com/sbraford/73f63d75bb995b6597754c1707e40cc2)

Frequently Asked Questions

Which programming languages / frameworks can I use?

Please use React or NextJS for the frontend of the application. The backend can be written in any language/framework of your choosing–including but not limited to Node, NextJS, python, Ruby on Rails, Java, etc.

What are some of the requirements of the mini-EMR?

Please use the data.json file provided via the link above to seed your database with the possible medications and dosages that can be prescribed to a patient. The patient prescription form should include the same data from the JSON file: medication name, dosage, quantity, refill date and refill schedule (i.e. monthly).

The patient appointment form should work similarly as per the sample included appointments, including a provider name, date time of the first appointment and a repeat schedule. Please provide a way to end recurring appointments, and to schedule new appointments. The provider name field can be a free-form text entry field.

For patient creation, please allow setting of the patient password. (One normally wouldn't code it that way but it will help us in testing the app)

What are some of the requirements of the Patient Portal?

Upon logging in via the main root page of the app ("/"), the user should be taken to their patient portal. The main page should just consist of a summary of the most important patient data and upcoming appointments/refills. The user should have a way to drill down into appointments, and medications, and see the full upcoming schedule of each (going out up to 3 months from the current date).

What platform should I deploy my application to as a demo?

You can choose any platform(s) of your choosing. Vercel, Netlify, Heroku, fly.io, AWS, Azure, etc. are all perfectly fine.

For the UI/ UX follow the below structure.  
Design a premium, modern healthcare interface inspired by the visual warmth, simplicity, and consumer-friendly experience of Get Zealthy.

Do not copy the original brand, logo, content, imagery, or exact layouts. Create an original design system with a similar level of polish, trust, clarity, and accessibility.

Focus only on UI, UX, visual design, responsiveness, and animation. Do not add or modify application functionality, backend logic, workflows, APIs, database models, or business requirements.

VISUAL DIRECTION

The interface should feel:

• Warm, trustworthy, and human  
• Minimal but not empty  
• Premium and editorial  
• Friendly rather than clinical  
• Calm, modern, and approachable  
• Highly polished across desktop and mobile  
• Easy to understand at a glance  
• More animated and interactive than a typical healthcare website

Avoid:

• Generic SaaS dashboard styling  
• Cold hospital aesthetics  
• Dense layouts  
• Excessive borders  
• Heavy shadows  
• Excessive gradients  
• Neon colors  
• Overuse of glassmorphism  
• Overly futuristic medical visuals  
• Cartoonish illustrations  
• Motion that distracts from content

COLOR SYSTEM

Use a soft healthcare-inspired palette:

Primary dark green: \#184D3B  
Interactive green: \#267A58  
Soft mint: \#DCEFE5  
Warm cream: \#F8F4EC  
Soft peach: \#F2D8CA  
Muted lavender: \#E8E2F2  
White: \#FFFFFF  
Primary text: \#18201D  
Secondary text: \#66706B  
Subtle border: \#DDE3DF

Use warm cream and white as the primary page backgrounds. Use green for primary actions, selected states, navigation emphasis, and progress indicators.

Do not overuse the primary green. Allow neutral space and lifestyle imagery to carry the design.

TYPOGRAPHY

Use a modern sans-serif font such as Geist, Manrope, Inter, or Satoshi.

Typography should include:

• Large editorial headlines  
• Tight but readable headline line heights  
• Clear distinction between headline, subheading, body, metadata, and labels  
• Conversational and confident copy presentation  
• Strong visual hierarchy created through typography and spacing  
• Large, readable body text  
• Minimal use of uppercase text  
• No tiny labels or overly light font weights

Headlines should feel bold, warm, and human rather than corporate.

LAYOUT SYSTEM

Use:

• Large sections with generous vertical spacing  
• Clean grid-based layouts  
• Asymmetrical compositions  
• Rounded cards with 20 to 32 pixel corner radii  
• Pill-shaped buttons and filters  
• Soft organic background shapes  
• Large editorial imagery  
• Spacious card interiors  
• Clear content grouping  
• Strong alignment and consistent rhythm  
• Maximum readable content widths  
• Layered visual depth without visual clutter

Create layouts that feel intentionally art-directed rather than generated from a standard component library.

NAVIGATION DESIGN

Create a premium sticky navigation bar.

Desktop navigation should include:

• Minimal logo area  
• Primary navigation links  
• One prominent pill-shaped action button  
• Optional secondary sign-in action  
• Subtle dropdown or mega-menu styling

Navigation behavior:

• Begin transparent or lightly blended into the hero  
• Transition into a solid or softly blurred background while scrolling  
• Reduce height slightly after scrolling  
• Add a subtle shadow or border only after scroll  
• Animate dropdown menus using opacity, scale, and vertical movement  
• Use a soft spring transition  
• Keep navigation movement subtle

Mobile navigation:

• Use a clean full-screen menu or animated side panel  
• Animate menu items with staggered entrance  
• Use large touch targets  
• Keep the primary action visible  
• Add a refined open and close icon transition

HERO DESIGN

Create a premium two-column hero section.

The hero should include:

• Large editorial headline  
• Short supporting paragraph  
• Primary pill-shaped button  
• Optional secondary text action  
• Small trust indicators  
• Large rounded lifestyle image or video  
• Floating UI cards or healthcare-related visual elements  
• Soft organic decorative shapes  
• Subtle layered depth

Hero visual treatment:

• Use oversized typography  
• Allow whitespace around the headline  
• Use one dominant image rather than several competing images  
• Keep floating cards minimal  
• Use realistic healthcare, wellness, or lifestyle imagery  
• Avoid stock photography that looks overly staged

Hero animation:

• Stagger the entrance of the headline, paragraph, buttons, and trust indicators  
• Use opacity, translateY, and subtle blur transitions  
• Animate the main image with a very slow scale effect  
• Add light mouse-based parallax on desktop only  
• Float secondary cards vertically by no more than 6 pixels  
• Move background shapes very slowly  
• Disable parallax and floating loops on mobile  
• Keep the hero immediately readable before animation completes

CARD DESIGN

Use large interactive cards throughout the interface.

Card characteristics:

• Rounded corners  
• Soft neutral or pastel backgrounds  
• Minimal borders  
• Very light shadows  
• Large imagery  
• Clear title and short description  
• Small directional icon  
• Generous spacing  
• Strong alignment

Card hover behavior:

• Lift the card by 3 to 4 pixels  
• Increase shadow slightly  
• Scale imagery to a maximum of 1.03  
• Move the arrow icon slightly forward  
• Add a subtle border-color transition  
• Keep the transition between 180 and 250 milliseconds  
• Do not use exaggerated scaling

For touch devices, replace hover behavior with pressed and selected states.

BUTTON DESIGN

Primary buttons should be:

• Pill-shaped  
• Dark green or rich green  
• High contrast  
• Large enough for touch interaction  
• Visually confident without looking aggressive

Button animation:

• Slight scale down on press  
• Soft background-color transition  
• Small icon movement  
• Optional subtle highlight sweep  
• No glowing effects  
• No continuous animation  
• Immediate visual feedback

Secondary buttons should use soft fills, outlines, or text-based treatments.

SECTION ANIMATIONS

Use scroll-triggered animations across major sections.

Recommended patterns:

• Fade and rise for headings  
• Staggered card reveals  
• Image reveal using mask or clip-path  
• Soft crossfade between visual states  
• Progress line drawing  
• Number count-up for meaningful statistics  
• Subtle image parallax  
• Horizontal content reveal  
• Shared-layout transitions  
• Animated tabs and segmented controls  
• Smooth accordion expansion  
• Animated chart drawing  
• Animated step indicators

Do not animate every element. Use animation only to guide attention, explain hierarchy, or communicate state changes.

SCROLL EXPERIENCE

The page should feel smooth and cinematic without hijacking scroll.

Use:

• Native scrolling  
• Sticky visual sections where appropriate  
• Scroll-linked progress indicators  
• Subtle parallax on large visual sections  
• Section transitions using background-color changes  
• Pinned content only when it improves storytelling  
• Smooth anchor navigation

Do not use:

• Forced scroll snapping on desktop  
• Scroll hijacking  
• Long pinned sections  
• Large zoom effects  
• Excessive horizontal scrolling  
• Animation that prevents users from quickly navigating

FORM UI

Style all forms to feel conversational and lightweight.

Use:

• One primary question or decision per visual section where possible  
• Large option cards  
• Clear labels  
• Large input fields  
• Soft selected states  
• Rounded controls  
• Visible progress indicators  
• Plain-language helper text  
• Clear validation feedback  
• Calm error states  
• Auto-save confirmation styling  
• Review states with strong visual grouping

Form animation:

• Animate between steps using a soft horizontal transition  
• Fade previous content while moving it slightly backward  
• Bring new content forward with opacity and small translate movement  
• Animate progress bars smoothly  
• Animate validation messages without causing layout jumps  
• Use a small, restrained shake only for important input errors  
• Preserve visual continuity between steps

DASHBOARD VISUAL STYLE

For authenticated areas, avoid a cold enterprise dashboard.

Use:

• Warm neutral backgrounds  
• Large summary cards  
• Clear next-action emphasis  
• Friendly progress visualizations  
• Soft status indicators  
• Rounded containers  
• Simple charts  
• Personalized greeting areas  
• Minimal sidebar navigation  
• Mobile bottom navigation where appropriate  
• Strong hierarchy between primary and secondary information

The most important action should be visually dominant.

Do not fill every space with cards. Allow sections to breathe.

CHARTS AND DATA VISUALIZATION

Use clean, friendly visualizations.

Preferred treatments:

• Rounded line charts  
• Soft area fills  
• Minimal grid lines  
• Simple tooltips  
• Clear labels  
• Smooth chart drawing animation  
• Calm progress rings  
• Horizontal progress bars  
• Timeline indicators  
• Small trend markers

Avoid overly technical analytics styling.

IMAGE TREATMENT

Use:

• Rounded editorial images  
• Lifestyle photography  
• Diverse, natural human imagery  
• Soft crops  
• Organic image masks  
• Full-bleed sections where appropriate  
• Subtle image overlays for text contrast

Animate images with:

• Slow scale movement  
• Clip-path reveals  
• Soft parallax  
• Crossfade transitions  
• Small hover zoom effects

Avoid rapid movement, autoplay with sound, or distracting loops.

MICROINTERACTIONS

Add refined microinteractions for:

• Buttons  
• Navigation links  
• Tabs  
• Accordions  
• Filters  
• Input focus states  
• Selection cards  
• Checkboxes  
• Progress indicators  
• Toast messages  
• Success states  
• Loading states  
• Empty states  
• Tooltips  
• Modals  
• Bottom sheets  
• Mobile navigation

Microinteractions should feel smooth, quiet, and responsive.

MOTION SYSTEM

Use Framer Motion or Motion for React.

Recommended timings:

Fast feedback: 120 to 180 milliseconds  
Standard transitions: 200 to 300 milliseconds  
Large section transitions: 350 to 500 milliseconds  
Page entrance transitions: maximum 600 milliseconds

Recommended spring values:

Stiffness: approximately 260  
Damping: approximately 24  
Mass: approximately 0.8

Movement limits:

Hover translation: maximum 4 pixels  
Floating movement: maximum 6 pixels  
Card hover scale: maximum 1.015  
Image hover scale: maximum 1.03  
Button press scale: approximately 0.98

Preferred easing:

Use smooth ease-out curves for entrance animations.  
Use springs for interactive elements.  
Use linear movement only for continuous progress indicators.

LOADING STATES

Create elegant loading experiences.

Use:

• Skeleton cards matching the final layout  
• Soft shimmer animation  
• Smooth content replacement  
• Progress indicators for longer actions  
• Animated placeholder shapes  
• No full-screen spinners unless necessary  
• No flashing skeletons  
• No layout shifts when content loads

PAGE TRANSITIONS

Add subtle route transitions.

Use:

• Short opacity transition  
• Small vertical movement  
• Shared-element transitions where appropriate  
• Persistent navigation  
• Immediate content availability  
• No long loading animation between routes

MOBILE EXPERIENCE

Design mobile layouts as intentionally as desktop layouts.

Mobile requirements:

• One-column layouts  
• Large touch targets  
• Sticky primary action where useful  
• Bottom sheets for secondary controls  
• Horizontal snap cards for visual collections  
• Simplified decorative elements  
• Reduced animation density  
• No hover-dependent interactions  
• Comfortable text sizes  
• Proper spacing around device edges  
• Clear mobile navigation  
• Thumb-friendly button placement

Do not simply stack the desktop layout. Recompose sections for mobile.

ACCESSIBILITY

Meet WCAG 2.2 AA standards.

Include:

• Strong color contrast  
• Visible keyboard focus states  
• Logical focus order  
• Semantic headings  
• Accessible dialogs and menus  
• Large touch targets  
• Screen-reader-friendly status changes  
• Clear form labels  
• Accessible validation messages  
• Reduced-motion support  
• No meaning communicated by color alone

REDUCED MOTION

When prefers-reduced-motion is enabled:

• Disable parallax  
• Disable floating loops  
• Disable animated background shapes  
• Remove large scale transitions  
• Replace slide transitions with short opacity changes  
• Stop decorative autoplay animation  
• Make content immediately visible  
• Preserve all interaction feedback

PERFORMANCE

Keep the interface visually rich but performant.

Use:

• Transform and opacity for animation  
• Lazy-loaded imagery  
• Responsive image sizing  
• Optimized SVG assets  
• Lightweight animation libraries  
• Paused animations when elements are offscreen  
• Minimal Lottie usage  
• No large background videos on mobile  
• No layout-shifting animation  
• No animation of width, height, top, or left unless necessary

FINAL DESIGN QUALITY

The final interface should feel like a polished, premium consumer healthcare product.

It should combine:

• Warm lifestyle branding  
• Minimal healthcare design  
• Editorial typography  
• Soft pastel colors  
• Large rounded visuals  
• Clear conversion-focused hierarchy  
• Thoughtful microinteractions  
• Calm motion  
• Premium mobile responsiveness  
• Strong accessibility  
• Original visual identity

The final result should feel inspired by the emotional quality and visual clarity of Get Zealthy while remaining completely original, more refined, and more intentionally animated.

