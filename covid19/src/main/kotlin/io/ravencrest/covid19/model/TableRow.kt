package io.ravencrest.covid19.model

data class TableRow(
  val region: String,
  val code: String,
  val cases: Long,
  val casesNormalized: Long,
  val change: Long?,
  val weeklyChange: Long?,
  val deaths: Long,
  val recovered: Long?,
  val population: Long,
  val gdp: Double?,
  val tests: Long?
)
