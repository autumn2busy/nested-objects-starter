export type TrainingModule = {
    id: string
    module_number: number
    title: string
    description: string
    icon: string
    estimated_hours: number
}

export type TrainingLesson = {
    id: string
    module_id: string
    lesson_number: number
    title: string
    content: string
    content_type: 'video' | 'text' | 'pdf' | 'audio' | 'mixed'
    video_url?: string
    audio_url?: string
    estimated_minutes: number
}

export type TrainingResource = {
    id: string
    module_id: string
    lesson_id?: string
    title: string
    description: string
    file_path: string
    file_type: string
    lesson_number?: number // Optional: sometimes joined from lesson table
}

export type TrainingProgress = {
    id: string
    user_id: string
    module_id: string
    lesson_id?: string
    resource_type: 'lesson' | 'quiz'
    status: 'started' | 'completed'
    quiz_score?: number
    completed_at?: string
}

export type TrainingFlashcard = {
    id: string
    module_id: string
    front_content: string
    back_content: string
    order_index: number
}

export type TrainingQuestion = {
    id: string
    module_id: string
    question_text: string
    options: string[]
    correct_answer: string
    explanation?: string
    order_index: number
}
