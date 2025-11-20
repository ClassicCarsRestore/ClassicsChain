package repository

// stringToNullable converts a string pointer to an empty string if nil
func stringToNullable(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// nullableToStringPtr converts an empty string to nil, otherwise returns pointer
func nullableToStringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
