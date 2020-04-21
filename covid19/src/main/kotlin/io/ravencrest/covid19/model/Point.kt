package io.ravencrest.covid19.model

import java.time.LocalDate

data class Point(
  val country: String,
  val population: Long,
  val rawValue: Double,
  val normalizedValue: Int,
  val date: LocalDate,
  val rank: Int? = null
)