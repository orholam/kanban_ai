export interface ProjectTypePrompts {
  projectPlan: string;
  firstWeekTasks: string;
  projectOverview: string;
}

export const PROJECT_TYPE_PROMPTS: Record<string, ProjectTypePrompts> = {
  "SaaS App": {
    projectPlan: `Your task is to create a detailed 10-week business and development roadmap for a SaaS startup founder.
    Focus on business milestones, customer validation, MVP development, and go-to-market strategy.
    Each week should have clear business objectives and development goals that can be tracked on a kanban board.
    Include phases for market research, MVP planning, development sprints, testing, and launch preparation.
    Break down each week into actionable tasks that can be organized into columns like "To Do", "In Progress", "Review", and "Done".`,
    
    firstWeekTasks: `Based on the following project plan, generate a list of 4-5 specific tasks for the first week:
    Focus on market research, competitor analysis, and initial MVP feature planning that can be tracked on your kanban board.`,
    
    projectOverview: `You are a business strategist helping a SaaS founder plan their startup journey.
    Create a high-level overview that focuses on building a successful SaaS business through proper planning, customer validation, and systematic execution.
    This roadmap will help you organize your work on a kanban board, tracking progress from idea validation through launch.
    Be practical and action-oriented, describing each phase in a way that translates directly to actionable tasks and milestones.
    The response should be tailored to their specific SaaS idea and target market, with clear phases that can be broken down into manageable tasks.
    The total length of your response should be 1-2 paragraphs.`
  },

  "AI Tool": {
    projectPlan: `Your task is to create a detailed 10-week roadmap for developing and launching an AI tool.
    Focus on AI model research, data preparation, tool design, user experience planning, and go-to-market strategy.
    Each week should have specific objectives for AI development, user research, and business planning that can be tracked on a kanban board.
    Include phases for AI research, tool design, user testing, and launch preparation.
    Break down each week into actionable tasks that can be organized into columns like "Research", "Design", "Development", "Testing", and "Launch".`,
    
    firstWeekTasks: `Based on the following project plan, generate a list of 4-5 specific tasks for the first week:
    Focus on AI tool research, user need analysis, and initial tool concept design that can be tracked on your kanban board.`,
    
    projectOverview: `You are an AI product strategist helping a founder plan their AI tool development.
    Create a high-level overview that focuses on building a successful AI tool through proper research, design, and systematic execution.
    This roadmap will help you organize your work on a kanban board, tracking progress from AI research through tool launch.
    Be practical and action-oriented, describing each phase in a way that translates directly to actionable tasks and milestones.
    The response should be tailored to their specific AI tool idea and target users, with clear phases that can be broken down into manageable tasks.
    The total length of your response should be 1-2 paragraphs.`
  },

  "Blog/Website": {
    projectPlan: `Your task is to create a detailed 10-week content and website development roadmap.
    Focus on content strategy, design planning, content creation, website development, and launch preparation.
    Each week should have specific content goals and development milestones that can be tracked on a kanban board.
    Include phases for content planning, design mockups, content creation, website building, and launch.
    Break down each week into actionable tasks that can be organized into columns like "Content Planning", "Writing", "Design", "Development", and "Launch".`,
    
    firstWeekTasks: `Based on the following project plan, generate a list of 4-5 specific tasks for the first week:
    Focus on content strategy planning, audience research, and initial content outline creation that can be tracked on your kanban board.`,
    
    projectOverview: `You are a content strategist helping a founder plan their blog or website development.
    Create a high-level overview that focuses on building a successful content platform through proper planning, content creation, and systematic execution.
    This roadmap will help you organize your work on a kanban board, tracking progress from content planning through website launch.
    Be practical and action-oriented, describing each phase in a way that translates directly to actionable tasks and milestones.
    The response should be tailored to their specific content goals and target audience, with clear phases that can be broken down into manageable tasks.
    The total length of your response should be 1-2 paragraphs.`
  },

  "Event Planning": {
    projectPlan: `Your task is to create a detailed 10-week event planning roadmap.
    Focus on event concept development, logistics planning, execution, and post-event follow-up.
    Each week should have specific event planning milestones and tasks that can be tracked on a kanban board.
    Include phases for event concept, venue selection, vendor coordination, execution, and follow-up.
    Break down each week into actionable tasks that can be organized into columns like "Planning", "Coordination", "Execution", and "Follow-up".`,
    
    firstWeekTasks: `Based on the following project plan, generate a list of 4-5 specific tasks for the first week:
    Focus on event concept development, initial budget planning, and venue research that can be tracked on your kanban board.`,
    
    projectOverview: `You are an event planning expert helping a founder plan their event.
    Create a high-level overview that focuses on executing a successful event through proper planning, coordination, and systematic execution.
    This roadmap will help you organize your work on a kanban board, tracking progress from event concept through post-event follow-up.
    Be practical and action-oriented, describing each phase in a way that translates directly to actionable tasks and milestones.
    The response should be tailored to their specific event type and goals, with clear phases that can be broken down into manageable tasks.
    The total length of your response should be 1-2 paragraphs.`
  }
};

// Default prompts for fallback
export const DEFAULT_PROMPTS: ProjectTypePrompts = {
  projectPlan: `Your task is to create a detailed 10-week project roadmap for a founder.
  Focus on breaking down their project into clear phases with specific milestones and objectives.
  Each week should have actionable goals that can be tracked on a kanban board.
  Break down each week into manageable tasks that can be organized into columns like "Planning", "In Progress", "Review", and "Complete".`,
  
  firstWeekTasks: `Based on the following project plan, generate a list of 4-5 specific tasks for the first week:
  Focus on initial planning and setup tasks that can be tracked on your kanban board.`,
  
  projectOverview: `You are a project strategist helping a founder plan their project.
  Create a high-level overview that focuses on successful project execution through proper planning and systematic execution.
  This roadmap will help you organize your work on a kanban board, tracking progress from planning through completion.
  Be practical and action-oriented, describing each phase in a way that translates directly to actionable tasks and milestones.
  The response should be tailored to their specific project goals, with clear phases that can be broken down into manageable tasks.
  The total length of your response should be 1-2 paragraphs.`
};

export function getPromptsForProjectType(projectType: string): ProjectTypePrompts {
  return PROJECT_TYPE_PROMPTS[projectType] || DEFAULT_PROMPTS;
} 