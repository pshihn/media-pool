import { CLASS_MEDIA_POOL_ELEMENT } from "./constants.js";

export class MediaTaskQeue<T extends HTMLMediaElement> {
  private media: T;
  private tasks: MediaTask[] = [];

  constructor(media: T) {
    this.media = media;
  }

  enqueue(task: MediaTask) {
    const running = this.tasks.length !== 0;
    this.tasks.push(task);
    if (!running) {
      this.executeNext();
    }
  }

  private async executeNext() {
    if (this.tasks.length === 0) {
      return;
    }
    const task = this.tasks[0];
    const run = async () => {
      this.tasks.shift();
      try {
        await task.run(this.media);
      } catch (err) {
        console.log('Media task error', err);
      }
      this.executeNext();
    };
    if (task.syncExecution) {
      run();
    } else {
      window.setTimeout(() => run(), 0);
    }
  }
}

export interface MediaSource {
  url: string;
  mime: string;
}

export abstract class MediaTask {
  syncExecution: boolean;

  constructor(syncExecution = false) {
    this.syncExecution = syncExecution;
  }

  abstract async run(media: HTMLMediaElement): Promise<void>;
}

export class PlayTask extends MediaTask {
  async run(media: HTMLMediaElement): Promise<void> {
    if (!media.paused) {
      return Promise.resolve();
    }
    const ret = media.play();
    if (typeof ret === 'boolean') {
      return Promise.resolve();
    }
    return ret;
  }
}

export class PauseTask extends MediaTask {
  async run(media: HTMLMediaElement): Promise<void> {
    media.pause();
    return Promise.resolve();
  }
}

export class MuteTask extends MediaTask {
  async run(media: HTMLMediaElement): Promise<void> {
    media.muted = true;
    media.setAttribute('muted', '');
    return Promise.resolve();
  }
}

export class UnmuteTask extends MediaTask {
  async run(media: HTMLMediaElement): Promise<void> {
    media.muted = false;
    media.removeAttribute('muted');
    return Promise.resolve();
  }
}

export class SetCurrentTimeTask extends MediaTask {
  private time: number;
  constructor(time = 0) {
    super();
    this.time = time;
  }

  async run(media: HTMLMediaElement): Promise<void> {
    media.currentTime = this.time;
    return Promise.resolve();
  }
}

export class LoadTesk extends MediaTask {
  async run(media: HTMLMediaElement): Promise<void> {
    media.load();
    return Promise.resolve();
  }
}

export class BlessTask extends MediaTask {
  constructor() {
    super(true);
  }

  async run(media: HTMLMediaElement): Promise<void> {
    const isMuted = media.muted;
    media.muted = false;
    if (isMuted) {
      media.muted = true;
    }
    return Promise.resolve();
  }
}

export class UpdateSourcesTask extends MediaTask {
  private sources: MediaSource[];

  constructor(sources: MediaSource[]) {
    super();
    this.sources = sources;
  }

  async run(media: HTMLMediaElement): Promise<void> {
    while (media.lastChild) {
      media.removeChild(media.lastChild);
    }
    for (const source of this.sources) {
      const se = document.createElement('source');
      se.setAttribute('src', source.url);
      se.setAttribute('type', source.mime);
      media.appendChild(se);
    }
    return Promise.resolve();
  }
}

export class AddToDomTask extends MediaTask {
  parent: HTMLElement;

  constructor(parent: HTMLElement) {
    super(true);
    this.parent = parent;
  }

  async run(media: HTMLMediaElement): Promise<void> {
    if (media.parentElement === this.parent) {
      return Promise.resolve();
    }
    const existing = this.parent.querySelector(`.${CLASS_MEDIA_POOL_ELEMENT}`);
    if (existing) {
      this.parent.replaceChild(media, existing);
    } else {
      this.parent.appendChild(media);
    }
    return Promise.resolve();
  }
}

export class RemoveFromDomTask extends MediaTask {
  constructor() {
    super(true);
  }

  async run(media: HTMLMediaElement): Promise<void> {
    if (media.parentElement) {
      media.parentElement.removeChild(media);
    }
    return Promise.resolve();
  }
}