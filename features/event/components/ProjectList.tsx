// features/event/components/ProjectList.tsx
import type { Project } from "../types/ProjectType";

export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <ul>
      {projects.map((project) => (
        <li key={project.id} className="border-b py-2">
          <div className="font-semibold">{project.name}</div>
          <div className="text-xs text-gray-500">
            {project.region || "–"} · {project.topics?.length ?? 0} Themen
          </div>
          <div>{project.description}</div>
        </li>
      ))}
    </ul>
  );
}
