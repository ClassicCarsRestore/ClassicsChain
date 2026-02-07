package repository

// stringToNullable converts a string pointer to an empty string if nil
func stringToNullable(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// stringOrEmpty returns the string value or empty string if nil
func stringOrEmpty(s *string) string {
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

// intToNullable converts an int pointer to *int32
func intToNullable(i *int) *int32 {
	if i == nil {
		return nil
	}
	v := int32(*i)
	return &v
}

// nullableToIntPtr converts *int32 to *int
func nullableToIntPtr(i *int32) *int {
	if i == nil {
		return nil
	}
	v := int(*i)
	return &v
}
