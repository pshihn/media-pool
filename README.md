# media-pool
A pool of reusable media elements for the web. This is akin to a thread pool in multi-threaded languages. A media player can request a media element (`<video>` or `<audio>`) from the pool. Once done it can release the element back into the pool. 

The pool is optimized, so it lazy-releases a media-element; which means if the media player is active again it can reuse its old media-element even though it was released. This prevents re-attaching to DOM and re-loading videos/audios. In the case where the released media-element has been allocated to some other player, the media player will get a new one from the pool.

[Read the blog post describing this media-pool](https://shihn.ca/posts/2020/media-pool/)

## Install and Usage

Available on npm:

```
npm install media-pool --save
```

In your code:

```javascript
import { VideoPool }  from 'media-pool'
// or for audio:
import { AudioPool }  from 'media-pool'
```

## API

#### constuctor

Create a pool by optionally providing the size the pool. Default value is 5. 

```javascript
const videoPool = new VideoPool();
const audioPool = new AudioPool(10);
```

#### initializeNode(parent: HTMLElement, sources: MediaSource[]): HTMLMediaElement

This  method will allocated a new media element with the provided source and appent the element as a child to the parent node provided. 
If the parent node already has a pool element as a child, that node is reused. **HTMLMediaElement** can be a HTMLVideoElement or an HTMLAudioElement based on which constructor was used. 

#### setCurrent(media: HTMLMediaElement | null)

Let the pool know that this particular media element is the active player. Set to null if there is no active player. 

#### release(media: HTMLMediaElement)

Release the element back to the pool. This will automatically pause the media. It will not remove the element from its parent in case it could be reused. But it will be removed when the pool runs out of unallocated elements.

#### play(media: HTMLMediaElement) 

Plays the media.

#### pause(media: HTMLMediaElement)

Pauses the media.

#### restart(media: HTMLMediaElement)

Restarts the media from the begining.

#### mute()

Mute all media

#### unmute()

Unmutes current media element (if any). It will also *bless* other elements in the pool. For more about blessing, read the [blog post](https://shihn.ca/posts/2020/media-pool/)

#### releaseAll()

Releases all media elements




