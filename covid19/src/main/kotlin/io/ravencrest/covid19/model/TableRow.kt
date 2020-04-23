package io.ravencrest.covid19.model

data class TableRow(
  val region: String,
  val cases: Long,
  val casesNormalized: Long,
  val deaths: Long,
  val deathsNormalized: Long,
  val population: Long,
  val rank: Int
)