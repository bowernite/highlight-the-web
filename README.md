<div align="center">
  <h1>Alfred Markdown Links 🪄</h1>
  <p>An Alfred workflow to automate generating notes and markdown links from a Chrome webpage.
</div>

Some examples:

- Hotkey to generate a markdown link for the current page, where the link title is the tab/document title
- Hotkey to generate a snipper with the selected text, followed by a `source` markdown link, where the link utilizes the new [Text Fragment API](https://wicg.github.io/ScrollToTextFragment/) to link _exactly_ to where the text is on the page
- Hotkeys for either of those, but appending it to a running clipboard (ultimately resulting a list of markdown notes)

## Why?

This workflow allows me to take notes in [my](https://github.com/babramczyk/wiki) [wiki](https://wiki.abramczyk.dev) pretty seamlessly. When done researching, I'll dump the clipboard into a wiki page, and organize if I think I need to. This has the effect of letting me take notes on topics I'm researching that would otherwise be too cumbersome to do.

But I do more than just copy -- I also include a `source` link at the end of each copied note, so that I can remember where I read something. Those links are _much_ more useful if they point right to the text on the page. Luckily, the Text Fragment spec was implemented by Chrome recently, so I leverage that.

Now, I can even more easily capture memories when researching, and go _exactly_ to where the memory came from. For me, that's been _**incredibly**_ powerful.

## The Text Fragment functionality

To generate the text fragment (from an AppleScript), I had to [fork a Google repo](https://github.com/babramczyk/link-to-text-fragment) that had the JavaScript necessary to generate a text fragment link in a robust way. See that fork for more details 😀

> I used to do this logic on my own, but the logic ends up being incredibly complex. So Google's code worked a bit better 😄
