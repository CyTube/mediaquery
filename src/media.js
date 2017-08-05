class Media {
    constructor(data) {
        this.id = data.id;
        this.type = data.type;
        this.title = data.title;
        this.duration = data.duration;
        this.meta = (data.meta != null) ? data.meta : {};
    }
}

export default Media;
