import { Heart, Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-background/95 backdrop-blur">
      <div className="page-container">
        <div className="flex h-16 items-center justify-center">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <span>Created with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>by</span>
            <a
              href="https://github.com/fluffy1211/moviedna"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors duration-200 font-medium"
            >
              <Github className="h-4 w-4" />
              <span>fluffy</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
