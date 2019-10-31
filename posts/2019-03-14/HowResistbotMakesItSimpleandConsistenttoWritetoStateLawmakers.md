---
title: How Resistbot Makes It Simple and Consistent to Write to State Lawmakers
categories: ["data-science","civic-engagement"]
author: Jason Katz-Brown
published: Thu, 14 Mar 2019 18:52:16 GMT
lastUpdated: 2019-03-15T18:06:37.198Z
---
![](https://cdn-images-1.medium.com/max/1024/1*TN4D52XajcYPSmWVhaarRA.jpeg)

Photo by [Michael](https://unsplash.com/photos/9wXvgLMDetA?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/search/photos/legislature?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)

Resistbot has delivered more than ten million letters to elected officials thanks to two design tenets:

*   It’s simple: text resist to 50409
*   It’s consistent: the same instructions apply nationwide

Almost immediately after launch, the feature requests started to roll in to be able to contact state legislators, in addition to Congress. It took well over a year to build, but [we did it](https://resistbot.news/you-can-now-text-your-state-lawmakers-with-resistbot-2cf8773ee06d)!

### Before Resistbot, It Was Real Complicated to Contact State Government

Let’s say you’re a voter in Pittsburgh and want to write a message of support for Gov. Wolf’s [21st century voting reform plan](https://www.governor.pa.gov/governor-wolf-announces-21st-century-voting-reform-plan-pennsylvania/) to the Governor and your Representative and Senator in the Pennsylvania General Assembly. You would have to go to 11 different websites\*, enter your address 3 times, and send 1 fax!

The goal was to eliminate all these steps, so all you have to do is text “state” to 50409. Resistbot will find your state legislators and governor and deliver your message like magic.

This is a game changer: now any influencer or advocacy group can say “text ‘state’ to 50409” to mobilize constituents around a bill under consideration in state government.

### Challenge One: State Legislatures Are Inconsistent

To Resistbot users it’s magic — and behind the scenes, state legislatures are awesome and complicated.

Some state legislatures have a consistent web form for all members, which is great. Some legislators make their email address public, which is pretty good too. And regrettably, many lawmakers still only publicize a fax number or postal mail address. To cover everybody, we needed to support web forms, email, fax, and postal mail.

State legislatures are also all over the place in representational structure. In most states, one person is represented by one state senator and one state representative. But many states are unique. For example:

*   A person in unicameral Nebraska is represented by one Senator only.
*   A person in Vermont is represented by one Representative and up to six Senators.
*   A person in New Hampshire has up to 10 Representatives in some House districts and may also be represented by one or more Representatives in [“floterial” districts](https://www.eagletribune.com/news/local_news/floterial-districts-are-back-in-granite-state/article_c535dc48-26e2-5083-8a74-62c6672c8344.html) which subsume multiple normal districts.
*   A person in Puerto Rico is represented by two Senators from their Senate district, 14 Senators elected at-large, one Representative from their House district, and 11 Representatives elected at-large. (There are especially many Senators because of Puerto Rico’s [unique guarantee of minimum legislative minority representation](https://en.wikipedia.org/wiki/Senate_of_Puerto_Rico#Majority_and_minority_parties).)

### Challenge Two: Open Data Is Fragmented

Before 2019, all of Resistbot’s database of Congressional representatives was hard-coded and maintained by hand. This was untenable as the transition to the 116th Congress approached. We also knew we could never maintain a database of 7500 state legislators and contact info by hand.

We decided to leverage existing open data sources, which allowed us to keep Resistbot up to date while improving open data. There is no single free source that covers all levels of government, so we needed a way to pull from a bunch of sources: [Open States](https://openstates.org), [UnitedStates.io](https://theunitedstates.io/congress-legislators), [Contact Congress](https://github.com/unitedstates/contact-congress). We also introduced our own open-source [repository](https://github.com/resistbot/contact-officials) of web contact form configurations for governors and state legislatures.

### Challenge Three: Resistbot Needed a Generalized Data Model

Resistbot previously assumed that a user has two US Senators reachable by web form, one US Representative reachable by [CWC](https://www.house.gov/doing-business-with-the-house/communicating-with-congress-cwc), one governor reachable by fax or postal mail, and that’s it.

Now, a user in Maryland would have also three state Delegates and one state Senator contactable by web form and email.

We needed to create a general database of all a user’s state and federal representatives, support writing to any or all of them, and deliver the message in the fastest manner possible.

### _Discovery_: a Database of Officials and How to Contact Them

We implemented _Discovery_ to bring all elected officials and how to contact them into one generic data model.

First, we needed to collect all elected officials in one place. Every hour, we pull the latest lawmaker data from [Open States](https://openstates.org) and [UnitedStates.io](https://theunitedstates.io/congress-legislators). We made an admin interface for overwriting any field, like fax numbers or Twitter handle (in addition to contributing updates upstream where possible; one exception is most elected official databases store only one fax number, but it’s important for Resistbot to cycle through all of an official’s fax numbers). We also used the _Discovery_ admin interface to manually add information on governors. Eventually we would love to pull in more types of officials, like city and county lawmakers!

Next, we taught _Discovery_ how to contact every official. The best way to contact an official is with their official web contact form, so an amazing crew of Resistbot volunteers scoured governor and state legislatures for web contact forms, teaching Resistbot how to use 73 contact forms for governors and state legislative chambers. (The trickiest part was the state legislative chambers — it can be very tricky to automatically choose the correct state legislator in some states, so we introduced metaprogramming in the contact form configurations to accommodate an entire legislative chamber with one configuration.) These are all open-source in our new [contact-officials](https://github.com/resistbot/contact-officials) repo. Every hour, _Discovery_ pulls them in, and also pulls from [contact-congress](https://github.com/unitedstates/contact-congress), which covers all US Senators’ web contact forms.

Finally, _Discovery_’s API exposes officials per user, best delivery method per official, and delivery method details per official and delivery method.

### Example With Engineering Gossip : )

Let’s say we text \`state\` to Resistbot from Braddock, PA. After we type our message:

1.  Resistbot asks service _Messenger_ to send the message to PA state government officials for House district 34 and Senate district 43.
2.  _Messenger_ asks _Discovery_ who those officials are. _Discovery_ returns Rep. Lee, Sen. Costa, and Gov. Wolf. _Messenger_ enqueues three messages in the ingress SQS queue.
3.  _Pathfinder_ reads from the ingress SQS queue and for each message, asks _Discovery_ which delivery method is best for delivering to the specific official. For example, the best delivery method for Rep. Lee is the official PA House web contact form, so _Discovery_ returns ‘web\_form’. _Pathfinder_ therefore adds this message to the ‘web\_form’ SQS queue. (There is one queue for each possible delivery method: ‘web\_form’, ‘cwc’, ‘email’, ‘fax’, ‘mail’.)
4.  _Mercury_ grabs the message for Rep. Lee, fires up a headless browser, downloads the delivery method details for ‘web\_form’ delivery method from _Discovery_, then follows the steps therein to fill in the user’s message and contact information and confirm the message was sent. (Each delivery method queue has its own consumer; the message to Sen. Costa will end up in the ‘fax’ queue, from which _Gemini_ will send the message to Twilio using the ‘fax’ delivery method details from _Discovery_.)

### Now It’s Up to You!

Text state to 50409, or to Resistbot on [Twitter](https://twitter.com/messages/compose?recipient_id=835740314006511618&text=state), [Messenger](https://m.me/resistbot), or [Telegram](https://t.me/resistbot) and make your voice heard in state government!

And we would also love your engineering help with the next round of bold engineering projects.

*   Make it possible to write to your city council!
*   Implement a flow to [Run For Something](https://runforsomething.net/)!
*   Teach Resistbot how to smartly categorize the topic of a user’s message!

[Email us](mailto:volunteer@resist.bot) to get started! Join all of us who made state reps happen in Resistbot: Chris Nardi, Jason Putorti, Matthew Coleman, Jesse Peters, Jason Cachia, Jason Katz-Brown.

In addition to [donating to Resistbot](https://resist.bot/donate), consider [supporting Open States with a donation](https://openstates.org/donate/) as well. For more than a decade, Open States has done tireless work scraping state legislature websites to produce an incredibly valuable open database of the people and bills of our state legislatures.

\* Give or take, with these steps :)

1.  Google “pennsylvania find my legislator”, click [https://www.legis.state.pa.us/cfdocs/legis/home/findyourlegislator](https://www.legis.state.pa.us/cfdocs/legis/home/findyourlegislator), enter your address, solve a captcha
2.  Click “Rep. KIM”, click mail icon, click “Email me”, enter address, email address, phone number, and write your message.
3.  Click “Sen. DiSANTO”, fire up your fax machine, write your name and message on a letter, fax it to (717) 783–3722
4.  Google “contact governor wolf”, click [https://www.governor.pa.gov/contact](https://www.governor.pa.gov/contact), click “Online Form”, enter address, email address, phone number, and write your message.