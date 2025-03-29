export enum ContentRating {
	EXPLICIT = 'rating-explicit',
	MATURE = 'rating-mature',
	TEEN_AND_UP = 'rating-teen',
	GENERAL_AUDIENCE = 'rating-general-audience',
	NONE = 'rating-notrated',
}

export enum Orientation {
	FEM_FEM = 'category-femslash',
	FEM_MALE = 'category-het',
	GEN = 'category-gen',
	MALE_MALE = 'category-slash',
	MULTI = 'category-multi',
	OTHER = 'category-other',
	NONE = 'category-none',
}

export enum ContentWarning {
	CHOSE_NOT_TO_WARN = 'warning-choosenotto',
	WARNINGS_APPLY = 'warning-yes',
	NONE = 'warning-no',
}

export enum Completion {
	COMPLETE = 'complete-yes',
	INCOMPLETE = 'complete-no',
	EXTERNAL = 'warning-external',
}
