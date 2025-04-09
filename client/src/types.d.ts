declare global {
    interface file {
        id: number
        name: string
        hash: string
        content: string
        signature: string
        userId: number
        size: number
        contentType: string | null
        createdAt: Date
    }
}

export {}
