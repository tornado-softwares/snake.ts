import readline = require("readline")

const entities_index = {
    0: { id: "ground", char: " ", collision: false, score: 0, },
    1: { id: "border-y", char: "║", collision: true, score: 0 },
    2: { id: "snake", char: "▮", collision: true, score: 0 },
    3: { id: "border-x", char: "═", collision: true, score: 0 },
    4: { id: "corner-tl", char: "╔", collision: true, score: 0 },
    5: { id: 'corner-tr', char: "╗", collision: true, score: 0 },
    6: { id: 'corner-bl', char: "╚", collision: true, score: 0 },
    7: { id: 'corner-br', char: "╝", collision: true, score: 0 },
    8: { id: 'apple', char: "✱", collision: false, score: 1, },
}

declare type entitie = keyof typeof entities_index
declare type snake_part = {
    y: number,
    x: number,
}

class Game {
    public width: number
    public height: number
    public entities: entitie[][]
    public direction: "left" | "right" | "up" | "down" = "right"
    public snake_parts: snake_part[] = []
    public score: number = 0
    public render_delay: number
    renders:number = 0
    start_timestamp: number = Date.now()
    pending_snake_parts_count: number = 0
    footer = "Welcome to snake.ts, press q to exit, arrows to set direction."

    constructor({ width, height, render_delay }: { width: number, height: number, render_delay: number }) {
        this.width = width
        this.height = height
        this.entities = []
        this.render_delay = render_delay

        this.init()
        this.start()
    }

    async start() {
        const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))
        while (true) {
            this.render()
            await sleep(this.render_delay)
        }
    }


    init() {
        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) process.stdin.setRawMode(true);

        process.stdin.on('keypress', (chunk, key) => {
            if (["right", "left", "up", "down"].includes(key.name)) {
                if (this.direction == "right" && key.name !== "left") this.direction = key.name
                else if (this.direction == "left" && key.name !== "right") this.direction = key.name
                else if (this.direction == "up" && key.name !== "down") this.direction = key.name
                else if (this.direction == "down" && key.name !== "up") this.direction = key.name
            }
            if (key.name == "q") process.exit()
        });

        for (let y = 0; y < this.height; y++) {
            const entities_line: entitie[] = []
            for (let x = 0; x < this.width; x++) {
                if (x == this.width - 1 && y == this.height - 1) {
                    entities_line.push(7)
                } else if (x == 0 && y == this.height - 1) {
                    entities_line.push(6)
                } else if (x == 0 && y == this.height - 1) {
                    entities_line.push(6)
                } else if (x == this.width - 1 && y == 0) {
                    entities_line.push(5)
                } else if (x == 0 && y == 0) {
                    entities_line.push(4)
                } else if ([0, this.width - 1].includes(x)) {
                    entities_line.push(1)
                } else if ([0, this.height - 1].includes(y)) {
                    entities_line.push(3)
                }
                else {
                    entities_line.push(0)
                }
            }
            this.entities.push(entities_line)
        }

        for (let i = 0; i < 3; i++) {
            this.snake_parts.push({
                y: (this.height / 2),
                x: (this.width / 2) - i,
            })
        }
    }

    render() {
        this.renders++
        readline.cursorTo(process.stdout, 0, -1);
        readline.clearScreenDown(process.stdout)
        
        const elapsed = Date.now() - this.start_timestamp;
        const total_seconds = Math.floor(elapsed / 1000);
        const seconds = total_seconds % 60; 
        const total_minutes = Math.floor(total_seconds / 60);
        const minutes = total_minutes % 60; 
        const hours = Math.floor(total_minutes / 60);

        if (this.pending_snake_parts_count > 0) {
            this.snake_parts.push({
                y: 1,
                x: 1,
            })
            this.pending_snake_parts_count--
        }

        const snake_parts_clone = structuredClone(this.snake_parts)
        for (let snake_part_index = 0; snake_part_index < this.snake_parts.length; snake_part_index++) {
            const snake_part = this.snake_parts[snake_part_index]!
            this.entities[snake_part.y]![snake_part.x]! = 0
            if (snake_part_index == 0) {
                if (this.direction == "down") snake_part.y += 1
                if (this.direction == "up") snake_part.y -= 1
                if (this.direction == "right") snake_part.x += 1
                if (this.direction == "left") snake_part.x -= 1
            } else {
                const previous_snake_part = snake_parts_clone[snake_part_index - 1]!
                snake_part.x = previous_snake_part.x
                snake_part.y = previous_snake_part.y
            }
        }

        for (const snake_part of this.snake_parts) {
            const base_block = entities_index[this.entities[snake_part.y]![snake_part.x]!]
            this.score += base_block.score
            this.pending_snake_parts_count += base_block.score
            if (this.render_delay > 100) {
                this.render_delay -= 10 * base_block.score
            }
            if (base_block.collision == true) {
                process.stdout.write(`Oh.. you loose well you made a score of ${this.score}, try again :) - later...\n`)
                process.exit()
            }
            else {
                this.entities[snake_part.y]![snake_part.x] = 2
            }
        }

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.entities[y]![x]! == 0) {
                    if (Math.random() < 0.000025) {
                        this.entities[y]![x] = 8
                    } else {
                        this.entities[y]![x] = 0
                    }
                }
            }
        }

        process.stdout.write(`Current score: ${this.score} | Render delay: ${this.render_delay} | Playing since ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s | ~${(this.renders/total_seconds).toFixed(2)} FPS\n` + this.entities.map(entities_line => entities_line.map(index => entities_index[index].char).join("")).join('\n') + `\n${this.width - this.footer.length > 0 ? " ".repeat((this.width - this.footer.length) / 2) : ""}${this.footer}`)
    }

}

const game = new Game({
    width: 90,
    height: 20,
    render_delay: 300
})

