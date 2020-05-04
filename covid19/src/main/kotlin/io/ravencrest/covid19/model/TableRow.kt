package io.ravencrest.covid19.model

data class TableRow(
  val region: String,
  val code: String,
  val cases: Long,
  val casesNormalized: Long,
  val change: Long?,
  val weeklyChange: Long?,
  val deaths: Long,
  val deathsNormalized: Long,
  val recovered: Long?,
  val recoveredNormalized: Long?,
  val population: Long
)
