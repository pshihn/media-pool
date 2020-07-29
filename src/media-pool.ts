import { MediaSource, MediaTaskQeue, UpdateSourcesTask, LoadTesk, RemoveFromDomTask, AddToDomTask, SetCurrentTimeTask, PauseTask, MuteTask, UnmuteTask, PlayTask, BlessTask } from './tasks.js';
import { CLASS_MEDIA_POOL_ELEMENT, BLANK_AUDIO_SRC, BLANK_VIDEO_SRC } from './constants.js';

export class MediaPool<T extends HTMLMediaElement> {
  private defaultSource: MediaSource;
  private available: T[] = [];
  private unavailable: T[] = [];
  private taskMap = new Map<T, MediaTaskQeue<T>>();
  private current?: T;
  private blessed = false;
  private muted = true;

  constructor(defaultSource: MediaSource, poolElements: T[]) {
    this.defaultSource = defaultSource;
    for (const media of poolElements) {
      media.setAttribute('muted', '');
      media.muted = true;
      media.setAttribute('playsinline', '');
      media.setAttribute('webkit-playsinline', '');
      media.classList.add(CLASS_MEDIA_POOL_ELEMENT);
      const q = new MediaTaskQeue<T>(media);
      this.taskMap.set(media, q);
      q.enqueue(new UpdateSourcesTask([this.defaultSource]));
      q.enqueue(new LoadTesk());
    }
  }

  initializeNode(parent: HTMLElement, sources: MediaSource[]): T {
    // check if parent already has a pool media element
    const childMedia = parent.querySelector(`.${CLASS_MEDIA_POOL_ELEMENT}`) as T;
    if (childMedia) {
      return childMedia;
    }
    // force media to be available if needed
    if ((!this.available.length) && this.unavailable.length) {
      this.release(this.unavailable[0]);
    }
    const media = this.available.shift();
    if (!media) {
      throw new Error('Media pool has more active elements than the pool size');
    }
    this.unavailable.push(media);
    const queue = this.taskMap.get(media)!;
    queue.enqueue(new RemoveFromDomTask());
    queue.enqueue(new AddToDomTask(parent));
    queue.enqueue(new UpdateSourcesTask(sources));
    queue.enqueue(new LoadTesk());
    return media;
  }

  setCurrent(media: T | null) {
    if (media) {
      if (this.current && (this.current !== media)) {
        this.pause(this.current);
      }
      this.current = media;
      const queue = this.taskMap.get(media);
      if (queue) {
        queue.enqueue(new SetCurrentTimeTask());
      }
    } else {
      if (this.current) {
        this.pause(this.current);
      }
      this.current = undefined;
    }
  }

  release(media: T) {
    const queue = this.taskMap.get(media);
    if (queue) {
      queue.enqueue(new PauseTask());
      queue.enqueue(new SetCurrentTimeTask());
    }
    let index = this.unavailable.indexOf(media);
    if (index >= 0) {
      this.unavailable.splice(index, 1);
    }
    index = this.available.indexOf(media);
    if (index < 0) {
      this.available.push(media);
    }
  }

  play(media: T) {
    const queue = this.taskMap.get(media);
    if (queue) {
      if (!this.muted) {
        queue.enqueue(new UnmuteTask());
      }
      queue.enqueue(new PlayTask());
    }
  }

  pause(media: T) {
    const queue = this.taskMap.get(media);
    if (queue) {
      queue.enqueue(new PauseTask());
    }
  }

  restart(media: T) {
    const queue = this.taskMap.get(media);
    if (queue) {
      queue.enqueue(new SetCurrentTimeTask());
      queue.enqueue(new PlayTask());
    }
  }

  mute() {
    for (const media of this.taskMap.keys()) {
      const queue = this.taskMap.get(media)!;
      queue.enqueue(new MuteTask());
    }
    this.muted = true;
  }

  unmute() {
    this.blessAll();
    if (this.current) {
      const queue = this.taskMap.get(this.current);
      if (queue) {
        queue.enqueue(new UnmuteTask());
      }
    }
    this.muted = false;
  }

  private blessAll() {
    if (this.blessed) {
      return;
    }
    for (const media of this.taskMap.keys()) {
      const queue = this.taskMap.get(media)!;
      queue.enqueue(new BlessTask());
    }
    this.blessed = true;
  }

  releaseAll() {
    for (const media of this.unavailable) {
      this.release(media);
    }
  }
}

export class VideoPool extends MediaPool<HTMLVideoElement> {
  constructor(poolSize = 5) {
    super(
      { url: BLANK_VIDEO_SRC, mime: 'video/mp4' },
      (new Array(poolSize)).map<HTMLVideoElement>(() => document.createElement('video'))
    );
  }
}

export class AudioPool extends MediaPool<HTMLAudioElement> {
  constructor(poolSize = 5) {
    super(
      { url: BLANK_AUDIO_SRC, mime: 'audio/wav' },
      (new Array(poolSize)).map<HTMLAudioElement>(() => document.createElement('audio'))
    );
  }
}