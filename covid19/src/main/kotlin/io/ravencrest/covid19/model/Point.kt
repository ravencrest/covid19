package io.ravencrest.covid19.model

import java.time.LocalDate

data class Point(
  val country: String,
  val value: Long,
  val date: LocalDate
)